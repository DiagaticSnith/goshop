"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhook = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const processOrderAddress_1 = require("../utils/processOrderAddress");
const webhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sig = req.headers["stripe-signature"];
    const rawBody = req.body; // Đã là Buffer do express.raw
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(rawBody, sig, process.env.ENDPOINT_SECRET || "");
    }
    catch (err) {
        console.error("Stripe signature error:", {
            message: err.message,
            signature: sig,
            secret: ((_a = process.env.ENDPOINT_SECRET) === null || _a === void 0 ? void 0 : _a.substring(0, 5)) + "...",
            rawBody: rawBody.toString()
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    let order;
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const lineItems = yield stripe_1.default.checkout.sessions.listLineItems(session.id);
        const items = yield Promise.all(lineItems.data.map((lineItem) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            const product = yield prisma_client_1.default.product.findUnique({
                where: { priceId: ((_b = lineItem.price) === null || _b === void 0 ? void 0 : _b.id) || '' }
            });
            return { product, quantity: lineItem.quantity || 0 };
        })));
        try {
            // Use a transaction to create order and update stock atomically
            order = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                var _c, _d, _e, _f, _g;
                // 1) Create order row first
                const created = yield tx.order.create({
                    data: {
                        amount: (session.amount_total || 0) / 100,
                        userId: ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.customerId) || "",
                        items: JSON.stringify(items),
                        country: ((_e = (_d = session.customer_details) === null || _d === void 0 ? void 0 : _d.address) === null || _e === void 0 ? void 0 : _e.country) || "",
                        address: (0, processOrderAddress_1.processOrderAddress)((_f = session.customer_details) === null || _f === void 0 ? void 0 : _f.address),
                        sessionId: session.id,
                        createdAt: new Date(session.created * 1000)
                    }
                });
                // 2) Decrement stock for each purchased item (non-negative)
                for (const it of items) {
                    const pid = (_g = it.product) === null || _g === void 0 ? void 0 : _g.id;
                    const qty = it.quantity || 0;
                    if (!pid || qty <= 0)
                        continue;
                    // Try conditional decrement when enough stock
                    const dec = yield tx.product.updateMany({
                        where: { id: pid, stockQuantity: { gte: qty } },
                        data: { stockQuantity: { decrement: qty } }
                    });
                    if (dec.count === 0) {
                        // Not enough stock: clamp to zero (avoid negative)
                        const cur = yield tx.product.findUnique({ where: { id: pid }, select: { stockQuantity: true } });
                        if (cur && cur.stockQuantity > 0) {
                            yield tx.product.update({ where: { id: pid }, data: { stockQuantity: 0 } });
                        }
                    }
                }
                return created;
            }));
        }
        catch (err) {
            console.error("Prisma create order error:", err.message);
        }
    }
    res.status(order ? 201 : 200).json({
        message: order ? "Order created" : "Event received",
        order
    });
});
exports.webhook = webhook;
