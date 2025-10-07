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
exports.bulkSync = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: __dirname + "/../../.env" });
const stripe_1 = __importDefault(require("stripe"));
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2022-11-15",
    typescript: true,
});
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function priceExists(priceId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield stripe.prices.retrieve(priceId);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
function createStripeForProduct(p) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Create product + price in one call (default_price_data)
        const sp = yield stripe.products.create({
            name: p.name,
            description: (_a = p.description) !== null && _a !== void 0 ? _a : undefined,
            images: p.image ? [p.image] : undefined,
            metadata: { dbProductId: p.id },
            default_price_data: {
                currency: "usd",
                unit_amount: Math.round(p.price * 100),
            },
        });
        const newPriceId = typeof sp.default_price === "string" ? sp.default_price : (_b = sp.default_price) === null || _b === void 0 ? void 0 : _b.id;
        return { stripeProductId: sp.id, priceId: newPriceId };
    });
}
function bulkSync({ batchSize = 20, concurrency = 4 } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Loading products from DB...");
        const products = yield prisma_client_1.default.product.findMany();
        // Filter products that need creation
        const candidates = [];
        for (const p of products) {
            if (!p.priceId) {
                candidates.push(p);
                continue;
            }
            const ok = yield priceExists(p.priceId).catch(() => false);
            if (!ok)
                candidates.push(p);
        }
        console.log(`Total products: ${products.length}, need create/update: ${candidates.length}`);
        let created = 0;
        let skipped = 0;
        let failed = 0;
        // Process in batches to control memory/throughput
        for (let i = 0; i < candidates.length; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1} (${batch.length} items)`);
            // concurrency-controlled worker pool
            const pool = [];
            for (const prod of batch) {
                const job = (() => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const maxRetries = 3;
                    let attempt = 0;
                    while (attempt < maxRetries) {
                        try {
                            const res = yield createStripeForProduct(prod);
                            if (res.priceId) {
                                yield prisma_client_1.default.product.update({ where: { id: prod.id }, data: { priceId: res.priceId } });
                                created++;
                                console.log(`Created price ${res.priceId} for product ${prod.id}`);
                            }
                            else {
                                console.warn(`No priceId returned for product ${prod.id}`);
                                failed++;
                            }
                            break;
                        }
                        catch (err) {
                            attempt++;
                            const retryAfter = (((_a = err === null || err === void 0 ? void 0 : err.headers) === null || _a === void 0 ? void 0 : _a["retry-after"]) && Number(err.headers["retry-after"]) * 1000) || (attempt * 1000);
                            console.warn(`Error creating Stripe for ${prod.id} (attempt ${attempt}): ${(err === null || err === void 0 ? void 0 : err.message) || err}. Retrying in ${retryAfter}ms`);
                            yield sleep(retryAfter);
                            if (attempt >= maxRetries) {
                                console.error(`Failed to create Stripe product for ${prod.id}:`, (err === null || err === void 0 ? void 0 : err.message) || err);
                                failed++;
                            }
                        }
                    }
                }))();
                pool.push(job);
                // throttle concurrency
                if (pool.length >= concurrency) {
                    yield Promise.race(pool).catch(() => { });
                    // remove settled promises
                    for (let j = pool.length - 1; j >= 0; j--) {
                        if (pool[j].isFulfilled)
                            pool.splice(j, 1);
                    }
                    // but simpler: await all finished using Promise.all with slice
                    yield Promise.all(pool.splice(0, concurrency).map(p => p.catch(() => { })));
                }
            }
            // wait remaining in this batch
            yield Promise.all(pool.map(p => p.catch(() => { })));
            // optional: small pause between batches
            yield sleep(500);
        }
        console.log(`Done. created=${created}, skipped=${skipped}, failed=${failed}`);
        yield prisma_client_1.default.$disconnect();
    });
}
exports.bulkSync = bulkSync;
// If run directly (node dist/...), call bulkSync
if (require.main === module) {
    bulkSync({ batchSize: 30, concurrency: 6 }).catch((err) => {
        console.error(err);
        prisma_client_1.default.$disconnect();
        process.exit(1);
    });
}
