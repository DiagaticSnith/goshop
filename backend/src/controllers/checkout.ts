import stripe from "../config/stripe";
import prisma from "../config/prisma-client";
import { NextFunction, Request, Response } from "express";

export const getCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.id);
        res.status(200).json(session);
    } catch (error) {
        next({ message: "Unable to retrieve the checkout session", error });
    }
};

export const getCheckoutItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const lineItems = await stripe.checkout.sessions.listLineItems(req.params.id);
        const items = await Promise.all(lineItems.data.map(async (lineItem) => {
            const product = await prisma.product.findUnique({
                where: {
                    priceId: lineItem.price?.id 
                }
            });
            return { productId: product?.id, quantity: lineItem.quantity };
        }));
        res.status(200).json(items);
    } catch (error) {
        next({ message: "Unable to retrieve the checkout items", error });
    }
};

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const baseUrl = process.env.NODE_ENV === "production" 
            ? (process.env.FRONTEND_URL || "https://yourdomain.com")
            : (process.env.FRONTEND_URL || "http://localhost:5173");
        const successUrl = `${baseUrl}/checkout/success?id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/checkout/cancel`; // Thêm cancel URL nếu cần

        // Validate stock before creating session
        const rawLineItems = (req.body.lineItems || []) as any[];
        try {
            for (const li of rawLineItems) {
                const priceId = li.price || li.priceId || li.price_id;
                const qty = li.quantity || li.qty || 0;
                if (!priceId || !qty) continue;
                const product = await prisma.product.findUnique({ where: { priceId } });
                if (!product) return res.status(400).json({ message: `Product for price ${priceId} not found` });
                if ((product.stockQuantity as number) < qty) {
                    return res.status(409).json({ message: `Insufficient stock for ${product.name}` });
                }
            }
        } catch (e) {
            console.error('Stock validation failed', e);
            return res.status(500).json({ message: 'Unable to validate stock' });
        }

        const session = await stripe.checkout.sessions.create({
            success_url: successUrl,
            cancel_url: cancelUrl, // Tùy chọn, để user quay lại nếu hủy
            mode: "payment",
            line_items: rawLineItems,
            currency: "usd",
            metadata: {
                customerId: req.body.userId
            }
        });

        res.status(201).json({ 
            sessionId: session.id, 
            url: session.url // Trả về URL đầy đủ
        });
    } catch (error: any) {
        console.error("Checkout session error:", error.code, error.message, error.stack);
        next({ message: "Unable to create the checkout session", error });
    }
};
