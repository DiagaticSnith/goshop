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
exports.createCheckoutSession = exports.getCheckoutItems = exports.getCheckoutSession = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const getCheckoutSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield stripe_1.default.checkout.sessions.retrieve(req.params.id);
        res.status(200).json(session);
    }
    catch (error) {
        next({ message: "Unable to retrieve the checkout session", error });
    }
});
exports.getCheckoutSession = getCheckoutSession;
const getCheckoutItems = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lineItems = yield stripe_1.default.checkout.sessions.listLineItems(req.params.id);
        const items = yield Promise.all(lineItems.data.map((lineItem) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const product = yield prisma_client_1.default.product.findUnique({
                where: {
                    priceId: (_a = lineItem.price) === null || _a === void 0 ? void 0 : _a.id
                }
            });
            return { productId: product === null || product === void 0 ? void 0 : product.id, quantity: lineItem.quantity };
        })));
        res.status(200).json(items);
    }
    catch (error) {
        next({ message: "Unable to retrieve the checkout items", error });
    }
});
exports.getCheckoutItems = getCheckoutItems;
const createCheckoutSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const baseUrl = process.env.NODE_ENV === "production"
            ? (process.env.FRONTEND_URL || "https://yourdomain.com")
            : (process.env.FRONTEND_URL || "http://localhost:5173");
        const successUrl = `${baseUrl}/checkout/success?id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/checkout/cancel`; // Thêm cancel URL nếu cần
        const session = yield stripe_1.default.checkout.sessions.create({
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: "payment",
            line_items: req.body.lineItems,
            currency: "usd",
            metadata: {
                customerId: req.body.userId
            }
        });
        res.status(201).json({
            sessionId: session.id,
            url: session.url // Trả về URL đầy đủ
        });
    }
    catch (error) {
        console.error("Checkout session error:", error.code, error.message, error.stack);
        next({ message: "Unable to create the checkout session", error });
    }
});
exports.createCheckoutSession = createCheckoutSession;
