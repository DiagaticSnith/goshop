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
import { register, httpRequestCounter, httpRequestDuration, httpRequestBytesTotal, httpResponseBytesTotal, frontendEventsCounter, frontendPageLoadSeconds, frontendJsErrors, frontendResourceErrors, frontendRequests, recordFrontendEvent, inFlightRequests } from './utils/metrics';
import { v2 as cloudinary } from "cloudinary";
import dbMetrics from './utils/dbMetrics';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to count requests and label by method/route/status
app.use((req, res, next) => {
    // track in-flight
    try { inFlightRequests.inc(); } catch (e) {}
        const start = Date.now();

        // track bytes received on request (supports chunked bodies and content-length)
        let reqBytes = 0;
        try {
            const cl = req.headers['content-length'];
            if (cl) reqBytes = Number(cl) || 0;
        } catch (e) { reqBytes = 0; }
        // also listen to data events for more accurate counts when available
        req.on && req.on('data', (chunk: any) => {
            try { reqBytes += (chunk && chunk.length) || 0; } catch (e) {}
        });

        // Wrap response write/end to count bytes sent
        let resBytes = 0;
        const origWrite = res.write;
        const origEnd = res.end;
        // @ts-ignore
        res.write = function (chunk: any, encoding?: any, cb?: any) {
            try {
                if (chunk) {
                    if (Buffer.isBuffer(chunk)) resBytes += chunk.length;
                    else if (typeof chunk === 'string') resBytes += Buffer.byteLength(chunk, encoding);
                }
            } catch (e) {}
            // @ts-ignore
            return origWrite.apply(res, arguments as any);
        };
        // @ts-ignore
        res.end = function (chunk: any, encoding?: any, cb?: any) {
            try {
                if (chunk) {
                    if (Buffer.isBuffer(chunk)) resBytes += chunk.length;
                    else if (typeof chunk === 'string') resBytes += Buffer.byteLength(chunk, encoding);
                }
            } catch (e) {}
            // @ts-ignore
            return origEnd.apply(res, arguments as any);
        };

        res.on('finish', () => {
                const duration = (Date.now() - start) / 1000;
                const route = (req as any).route?.path || req.path || 'unknown';
                const status = String(res.statusCode);
                try {
                        httpRequestCounter.inc({ method: req.method, route, status });
                        httpRequestDuration.observe({ method: req.method, route, status }, duration);
                        // record bytes counters
                        try { httpRequestBytesTotal.inc({ method: req.method, route, status }, reqBytes); } catch (e) {}
                        try { httpResponseBytesTotal.inc({ method: req.method, route, status }, resBytes); } catch (e) {}
                } catch (e) {
                        // ignore
                }
                try { inFlightRequests.dec(); } catch (e) {}
        });
        next();
});

// The Stripe webhook requires the raw body for signature verification.
// Register the webhook route BEFORE any body parsers so express.raw can read the raw buffer.
app.post("/api/webhook", express.raw({type: "application/json"}), webhook);

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
        // Map common RUM events into specific metrics
        try {
            if (event === 'page_load') {
                const duration = Number(body.duration || body.value || 0);
                const route = String(body.route || page || req.path || 'unknown');
                const origin = String(body.origin || req.headers.origin || 'unknown');
                if (!Number.isNaN(duration) && duration > 0) {
                    frontendPageLoadSeconds.observe({ route, origin }, duration);
                } else {
                    // fallback: still record generic event
                    recordFrontendEvent(event, { page, userAgent: String(ua) });
                }
            } else if (event === 'js_error') {
                frontendJsErrors.inc({ route: String(body.route || page || 'unknown'), severity: String(body.severity || 'error') });
            } else if (event === 'resource_error') {
                frontendResourceErrors.inc({ route: String(body.route || page || 'unknown'), resource_type: String(body.resource_type || 'unknown') });
            } else if (event === 'frontend_request') {
                frontendRequests.inc({ route: String(body.route || page || 'unknown'), method: String(body.method || 'GET'), status: String(body.status || '0') });
            } else {
                recordFrontendEvent(event, { page, userAgent: String(ua) });
            }
        } catch (err) {
            // swallow metric errors
            recordFrontendEvent(event, { page, userAgent: String(ua) });
        }
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