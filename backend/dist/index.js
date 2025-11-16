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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "D:/All Projects/goshop/backend/.env" });
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const products_1 = __importDefault(require("./routes/products"));
const users_1 = __importDefault(require("./routes/users"));
const checkout_1 = __importDefault(require("./routes/checkout"));
const orders_1 = __importDefault(require("./routes/orders"));
const auth_1 = __importDefault(require("./routes/auth"));
const category_1 = __importDefault(require("./routes/category"));
const cart_1 = __importDefault(require("./routes/cart"));
const webhook_1 = require("./controllers/webhook");
const path_1 = __importDefault(require("path"));
const prom_client_1 = __importDefault(require("prom-client"));
const cloudinary_1 = require("cloudinary");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Prometheus metrics setup
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
const httpRequestCounter = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register]
});
// Middleware to count requests and label by method/route/status
app.use((req, res, next) => {
    res.on('finish', () => {
        var _a;
        try {
            const route = ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.path || 'unknown';
            httpRequestCounter.inc({ method: req.method, route, status: String(res.statusCode) }, 1);
        }
        catch (e) {
            // ignore metric errors
        }
    });
    next();
});
// Expose Prometheus metrics
app.get('/metrics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.set('Content-Type', register.contentType || 'text/plain; version=0.0.4');
        const metrics = yield register.metrics();
        res.send(metrics);
    }
    catch (err) {
        res.status(500).send((err === null || err === void 0 ? void 0 : err.message) || 'unable to collect metrics');
    }
}));
// Build allowed origins from environment or default dev hosts
const defaultAllowed = ["http://localhost:5173", "http://localhost:4173"];
const devAdminHosts = ["http://localhost:5174", "http://host.docker.internal:5174"];
const envAllowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean) : [];
const allowedOrigins = Array.from(new Set([...defaultAllowed, ...devAdminHosts, ...envAllowed, process.env.FRONTEND_URL || ""])).filter(Boolean);
const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use((0, cors_1.default)(corsOptions));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
app.post("/api/webhook", express_1.default.raw({ type: "application/json" }), webhook_1.webhook);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads/", express_1.default.static(path_1.default.join(process.cwd(), "/uploads/")));
app.use("/products", products_1.default);
app.use("/users", users_1.default);
app.use("/orders", orders_1.default);
app.use("/checkout", checkout_1.default);
app.use("/cart", cart_1.default);
app.use("/auth", auth_1.default);
app.use("/category", category_1.default);
// Support both singular and plural category routes for compatibility with frontend bundles
app.use("/categories", category_1.default);
app.use(errorMiddleware_1.errorMiddleware);
app.listen({ address: "0.0.0.0", port: PORT }, () => {
    console.log(`Server running on port: ${PORT}`);
});
