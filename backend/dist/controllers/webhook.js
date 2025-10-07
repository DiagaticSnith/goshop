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
    var _a, _b, _c, _d, _e;
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
            var _f;
            const product = yield prisma_client_1.default.product.findUnique({
                where: { priceId: ((_f = lineItem.price) === null || _f === void 0 ? void 0 : _f.id) || '' }
            });
            return { product, quantity: lineItem.quantity || 0 };
        })));
        try {
            order = yield prisma_client_1.default.order.create({
                data: {
                    amount: (session.amount_total || 0) / 100,
                    userId: ((_b = session.metadata) === null || _b === void 0 ? void 0 : _b.customerId) || "",
                    items: JSON.stringify(items),
                    country: ((_d = (_c = session.customer_details) === null || _c === void 0 ? void 0 : _c.address) === null || _d === void 0 ? void 0 : _d.country) || "",
                    address: (0, processOrderAddress_1.processOrderAddress)((_e = session.customer_details) === null || _e === void 0 ? void 0 : _e.address),
                    sessionId: session.id,
                    createdAt: new Date(session.created * 1000)
                }
            });
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
