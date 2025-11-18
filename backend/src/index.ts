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
import client from 'prom-client';
import { register, httpRequestCounter, httpRequestDuration, frontendEventsCounter, recordFrontendEvent, inFlightRequests } from './utils/metrics';
import { v2 as cloudinary } from "cloudinary";
import dbMetrics from './utils/dbMetrics';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to count requests and label by method/route/status
app.use((req, res, next) => {
    // track in-flight
    try { inFlightRequests.inc(); } catch (e) {}

    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = (req as any).route?.path || req.path || 'unknown';
        try {
            httpRequestCounter.inc({ method: req.method, route, status: String(res.statusCode) });
            httpRequestDuration.observe({ method: req.method, route, status: String(res.statusCode) }, duration);
        } catch (e) {
            // ignore
        }
        try { inFlightRequests.dec(); } catch (e) {}
    });
    next();
});

// Parse JSON bodies for telemetry ingestion and other POSTs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose Prometheus metrics
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', (register as any).contentType || 'text/plain; version=0.0.4');
        const metrics = await register.metrics();
        res.send(metrics);
    } catch (err: any) {
        res.status(500).send(err?.message || 'unable to collect metrics');
    }
});

// Accept lightweight frontend telemetry via POST or navigator.sendBeacon
app.post('/metrics/events', (req, res) => {
    try {
        const body = req.body || {};
        const event = typeof body.event === 'string' ? body.event : (req.query.event as string | undefined);
        const page = typeof body.page === 'string' ? body.page : (req.query.page as string | undefined);
        const ua = req.headers['user-agent'] || 'unknown';
        if (!event) return res.status(400).json({ message: 'missing event' });
        recordFrontendEvent(event, { page, userAgent: String(ua) });
        // Accept both beacon and normal posts; respond quickly
        return res.status(204).end();
    } catch (e) {
        return res.status(500).json({ message: 'unable to record event' });
    }
});

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

// Start optional DB metrics collector
try {
    dbMetrics.start();
} catch (e) {
    console.warn('dbMetrics: start failed', e && (e as any).message);
}

app.listen({ address: "0.0.0.0", port: PORT }, () => {
        console.log(`Server running on port: ${PORT}`);
});