import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "D:/All Projects/goshop/backend/.env" });
import { errorMiddleware } from "./middleware/errorMiddleware";
import productRoutes from "./routes/products";
import usersRoutes from "./routes/users";
import checkoutRoutes from "./routes/checkout";
import ordersRoutes from "./routes/orders";
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/category";
import cartRoutes from "./routes/cart";
import { webhook } from "./controllers/webhook";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const app = express();
const PORT = process.env.PORT || 3000;

// Build allowed origins from environment or default dev hosts
const defaultAllowed = ["http://localhost:5173", "http://localhost:4173"];
const devAdminHosts = ["http://localhost:5174", "http://host.docker.internal:5174"];
const envAllowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean) : [];
const allowedOrigins = Array.from(new Set([...defaultAllowed, ...devAdminHosts, ...envAllowed, process.env.FRONTEND_URL || ""])).filter(Boolean);

const corsOptions = {
    origin: function (origin: any, callback: any) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post("/api/webhook", express.raw({type: "application/json"}), webhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/", express.static(path.join(process.cwd(), "/uploads/")));
app.use("/products", productRoutes);
app.use("/users", usersRoutes);
app.use("/orders", ordersRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/cart", cartRoutes);
app.use("/auth", authRoutes);
app.use("/category", categoryRoutes);
// Support both singular and plural category routes for compatibility with frontend bundles
app.use("/categories", categoryRoutes);

app.use(errorMiddleware);

app.listen({ address: "0.0.0.0", port: PORT }, () => {
    console.log(`Server running on port: ${PORT}`);
});