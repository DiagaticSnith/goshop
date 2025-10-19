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
exports.getInventoryStats = exports.setProductStatus = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsByCategory = exports.searchForProducts = exports.getProductById = exports.getAllProducts = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
// Return true if value is an absolute http/https URL
const isUrl = (val) => {
    return typeof val === 'string' && /^https?:\/\//i.test(val);
};
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield prisma_client_1.default.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
            category: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    if (!products) {
        return res.status(404).json({ message: "Products not found" });
    }
    res.status(200).json(products);
});
exports.getAllProducts = getAllProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_client_1.default.product.findFirst({
        where: { id: req.params.id, status: 'ACTIVE' },
        include: { category: true }
    });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
});
exports.getProductById = getProductById;
const searchForProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { searchQuery } = req.body;
        if (searchQuery.length > 0 && searchQuery.indexOf(" ") === -1) {
            searchQuery = `${searchQuery}*`;
        }
        const products = yield prisma_client_1.default.product.findMany({
            where: {
                status: 'ACTIVE',
                name: { search: searchQuery },
                description: { search: searchQuery }
            },
            orderBy: {
                _relevance: {
                    fields: ["name"],
                    search: "database",
                    sort: "asc"
                }
            }
        });
        if (!products) {
            return res.status(404).json({ message: "Products not found" });
        }
        res.status(200).json(products);
    }
    catch (error) {
        next({ message: "Unable to search for products", error });
    }
});
exports.searchForProducts = searchForProducts;
const getProductsByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield prisma_client_1.default.product.findMany({
        where: {
            categoryId: Number(req.params.id),
            status: 'ACTIVE'
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    if (!products) {
        return res.status(404).json({ message: "Products not found" });
    }
    res.status(200).json(products);
});
exports.getProductsByCategory = getProductsByCategory;
const createProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const image = req.image || undefined;
        // Prisma requires a non-null `image`; use empty string in DB if upload failed.
        const imageForDb = req.image || "";
        const stripePayload = {
            name: req.body.name,
            description: req.body.description,
            default_price_data: {
                currency: "usd",
                unit_amount: Math.round(Number(req.body.price) * 100)
            }
        };
        if (image && isUrl(image))
            stripePayload.images = [image];
        const stripeProduct = yield stripe_1.default.products.create(stripePayload);
        const newProduct = yield prisma_client_1.default.product.create({
            data: {
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: stripeProduct.id,
                priceId: stripeProduct.default_price,
                image: imageForDb,
                name: req.body.name,
                description: req.body.description,
                status: 'ACTIVE',
                weight: req.body.weight ? Number(req.body.weight) : undefined,
                width: req.body.width ? Number(req.body.width) : undefined,
                height: req.body.height ? Number(req.body.height) : undefined,
                brand: req.body.brand || undefined,
                material: req.body.material || undefined,
                category: {
                    connectOrCreate: {
                        where: {
                            name: req.body.category
                        },
                        create: {
                            name: req.body.category
                        }
                    }
                }
            }
        });
        res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('createProduct error', error);
        next({ message: "Unable to create the product with given details", error });
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const foundProduct = yield prisma_client_1.default.product.findFirst({
            where: {
                id: req.params.id
            }
        });
        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        try {
            yield stripe_1.default.products.update(foundProduct.id, {
                active: false
            });
        }
        catch (err) {
            // If the Stripe product was already deleted/doesn't exist, don't fail the whole request.
            // Log and continue to create a new Stripe product below.
            if (err && (err.type === 'StripeInvalidRequestError' || ((_a = err.raw) === null || _a === void 0 ? void 0 : _a.code) === 'resource_missing')) {
                console.warn(`Stripe product not found when attempting to deactivate id=${foundProduct.id}, continuing to recreate:`, err.message || err);
            }
            else {
                // rethrow unknown Stripe errors so they can be handled by error middleware
                throw err;
            }
        }
        const image = req.image || foundProduct.image || undefined;
        // For DB write, ensure non-null image value
        const imageForDb = req.image || foundProduct.image || "";
        const updatedStripePayload = {
            name: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.name) || foundProduct.name,
            description: ((_c = req.body) === null || _c === void 0 ? void 0 : _c.description) || foundProduct.description,
            default_price_data: {
                currency: "usd",
                unit_amount: Math.round((((_d = req.body) === null || _d === void 0 ? void 0 : _d.price) || foundProduct.price) * 100)
            }
        };
        if (image && isUrl(image))
            updatedStripePayload.images = [image];
        const updatedStripeProduct = yield stripe_1.default.products.create(updatedStripePayload);
        const updatedProduct = yield prisma_client_1.default.product.update({
            where: {
                id: req.params.id
            },
            data: {
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: updatedStripeProduct.id,
                priceId: updatedStripeProduct.default_price,
                image: imageForDb,
                name: req.body.name,
                description: req.body.description,
                weight: req.body.weight ? Number(req.body.weight) : undefined,
                width: req.body.width ? Number(req.body.width) : undefined,
                height: req.body.height ? Number(req.body.height) : undefined,
                brand: req.body.brand || undefined,
                material: req.body.material || undefined,
                category: {
                    connectOrCreate: {
                        where: {
                            name: req.body.category
                        },
                        create: {
                            name: req.body.category
                        }
                    }
                }
            }
        });
        res.status(200).json(updatedProduct);
    }
    catch (error) {
        console.error('updateProduct error', error);
        next({ message: "Unable to update the product with given details", error });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existing = yield prisma_client_1.default.product.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ message: 'Product not found' });
        const updated = yield prisma_client_1.default.product.update({
            where: { id: req.params.id },
            data: { status: 'HIDDEN' }
        });
        // Keep Stripe product inactive
        try {
            yield stripe_1.default.products.update(req.params.id, { active: false });
        }
        catch (_e) { }
        res.status(200).json(updated);
    }
    catch (error) {
        next({ message: "Unable to delete the product", error });
    }
});
exports.deleteProduct = deleteProduct;
// Admin: set product status (ACTIVE/HIDDEN)
const setProductStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        if (!status || (status !== 'ACTIVE' && status !== 'HIDDEN')) {
            return res.status(400).json({ message: 'Invalid status. Use ACTIVE or HIDDEN.' });
        }
        const existing = yield prisma_client_1.default.product.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ message: 'Product not found' });
        const updated = yield prisma_client_1.default.product.update({ where: { id: req.params.id }, data: { status: status } });
        try {
            // Keep Stripe product inactive when hidden; do nothing when active
            if (status === 'HIDDEN') {
                yield stripe_1.default.products.update(req.params.id, { active: false });
            }
        }
        catch (_f) { }
        res.status(200).json(updated);
    }
    catch (error) {
        next({ message: 'Unable to set product status', error });
    }
});
exports.setProductStatus = setProductStatus;
// Admin: inventory statistics (counts and stock summary)
const getInventoryStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [productsCount, outOfStockCount, lowStockCount, stockAggregate] = yield Promise.all([
            prisma_client_1.default.product.count({ where: { status: 'ACTIVE' } }),
            prisma_client_1.default.product.count({ where: { stockQuantity: 0, status: 'ACTIVE' } }),
            prisma_client_1.default.product.count({ where: { stockQuantity: { lte: 5 }, status: 'ACTIVE' } }),
            prisma_client_1.default.product.aggregate({ _sum: { stockQuantity: true }, where: { status: 'ACTIVE' } })
        ]);
        const totalStock = stockAggregate._sum.stockQuantity || 0;
        return res.status(200).json({
            productsCount,
            totalStock,
            outOfStockCount,
            lowStockCount
        });
    }
    catch (error) {
        next({ message: "Unable to compute inventory stats", error });
    }
});
exports.getInventoryStats = getInventoryStats;
