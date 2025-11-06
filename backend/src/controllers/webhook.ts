import { Request, Response } from "express";
import stripe from "../config/stripe";
import prisma from "../config/prisma-client";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { processOrderAddress } from "../utils/processOrderAddress";

export const webhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const rawBody = req.body; // Đã là Buffer do express.raw

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.ENDPOINT_SECRET || "");
    } catch (err: any) {
        console.error("Stripe signature error:", {
            message: err.message,
            signature: sig,
            secret: process.env.ENDPOINT_SECRET?.substring(0, 5) + "...",
            rawBody: rawBody.toString()
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    let order;
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;


        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        const items = await Promise.all(lineItems.data.map(async (lineItem) => {
            const product = await prisma.product.findUnique({
                where: { priceId: lineItem.price?.id || '' }
            });
            return { product, quantity: lineItem.quantity || 0 };
        }));

        try {
            // Use a transaction to create order and update stock atomically
            order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // 1) Create order row first
                const created = await tx.order.create({
                    data: {
                        amount: (session.amount_total || 0) / 100,
                        userId: session.metadata?.customerId || "",
                        items: JSON.stringify(items),
                        country: session.customer_details?.address?.country || "",
                        address: processOrderAddress(session.customer_details?.address as Stripe.Address | null),
                        sessionId: session.id,
                        createdAt: new Date(session.created * 1000)
                    }
                });

                // 2) Decrement stock for each purchased item (non-negative)
                for (const it of items) {
                    const pid = it.product?.id as string | undefined;
                    const qty = it.quantity || 0;
                    if (!pid || qty <= 0) continue;

                    // Try conditional decrement when enough stock
                    const dec = await tx.product.updateMany({
                        where: { id: pid, stockQuantity: { gte: qty } },
                        data: { stockQuantity: { decrement: qty } }
                    });

                    if (dec.count === 0) {
                        // Not enough stock: clamp to zero (avoid negative)
                        const cur = await tx.product.findUnique({ where: { id: pid }, select: { stockQuantity: true } });
                        if (cur && (cur.stockQuantity as number) > 0) {
                            await tx.product.update({ where: { id: pid }, data: { stockQuantity: 0 } });
                        }
                    }
                }

                return created;
            order = await prisma.order.create({
                data: {
                    amount: (session.amount_total || 0) / 100,
                    userId: session.metadata?.customerId || "",
                    items: JSON.stringify(items),
                    country: session.customer_details?.address?.country || "",
                    // Prefer the address user provided in metadata if present; fallback to Stripe normalized address
                    address: (session.metadata?.address && session.metadata.address.trim().length > 0)
                        ? session.metadata.address
                        : processOrderAddress(session.customer_details?.address as Stripe.Address | null),
                    sessionId: session.id,
                    status: 'PENDING' as any,
                    createdAt: new Date(session.created * 1000)
                },
            });

            // Clear user's cart after successful order creation
            const userId = session.metadata?.customerId;
            if (userId) {
                const userCart = await prisma.cart.findUnique({
                    where: { userId },
                    include: { items: true }
                });
                if (userCart) {
                    // Delete all cart items first, then optionally the cart itself
                    await prisma.cartItem.deleteMany({
                        where: { cartId: userCart.id }
                    });
                }
            }
        } catch (err: any) {
            console.error("Prisma create order error:", err.message);
        }
    }

    res.status(order ? 201 : 200).json({
        message: order ? "Order created" : "Event received",
        order
    });
};