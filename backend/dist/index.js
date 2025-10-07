"use strict";
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
const webhook_1 = require("./controllers/webhook");
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:4173", process.env.FRONTEND_URL || ""]
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
app.use("/auth", auth_1.default);
app.use("/category", category_1.default);
app.use(errorMiddleware_1.errorMiddleware);
app.listen({ address: "0.0.0.0", port: PORT }, () => {
    console.log(`Server running on port: ${PORT}`);
});
