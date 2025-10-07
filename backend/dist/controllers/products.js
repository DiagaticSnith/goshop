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
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsByCategory = exports.searchForProducts = exports.getProductById = exports.getAllProducts = void 0;
const stripe_1 = __importDefault(require("../config/stripe"));
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield prisma_client_1.default.product.findMany({
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
    const product = yield prisma_client_1.default.product.findUnique({
        where: {
            id: req.params.id
        }
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
                name: {
                    search: searchQuery
                },
                description: {
                    search: searchQuery
                }
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
            categoryId: Number(req.params.id)
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
        const image = req.image || "";
        const stripeProduct = yield stripe_1.default.products.create({
            name: req.body.name,
            description: req.body.description,
            default_price_data: {
                currency: "usd",
                unit_amount: req.body.price * 100
            },
            images: [image]
        });
        const newProduct = yield prisma_client_1.default.product.create({
            data: {
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: stripeProduct.id,
                priceId: stripeProduct.default_price,
                image,
                name: req.body.name,
                description: req.body.description,
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
        next({ message: "Unable to create the product with given details", error });
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const foundProduct = yield prisma_client_1.default.product.findFirst({
            where: {
                id: req.params.id
            }
        });
        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        yield stripe_1.default.products.update(foundProduct.id, {
            active: false
        });
        const image = req.image || foundProduct.image;
        const updatedStripeProduct = yield stripe_1.default.products.create({
            name: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.name) || foundProduct.name,
            description: ((_b = req.body) === null || _b === void 0 ? void 0 : _b.description) || foundProduct.description,
            default_price_data: {
                currency: "usd",
                unit_amount: (((_c = req.body) === null || _c === void 0 ? void 0 : _c.price) || foundProduct.price) * 100
            },
            images: [image]
        });
        const updatedProduct = yield prisma_client_1.default.product.update({
            where: {
                id: req.params.id
            },
            data: {
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: updatedStripeProduct.id,
                priceId: updatedStripeProduct.default_price,
                image,
                name: req.body.name,
                description: req.body.description,
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
        next({ message: "Unable to update the product with given details", error });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedProduct = yield prisma_client_1.default.product.delete({
            where: {
                id: req.params.id
            }
        });
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        yield prisma_client_1.default.category.deleteMany({
            where: {
                products: {
                    none: {}
                }
            }
        });
        yield stripe_1.default.products.update(req.params.id, {
            active: false
        });
        res.status(200).json(deletedProduct);
    }
    catch (error) {
        next({ message: "Unable to delete the product", error });
    }
});
exports.deleteProduct = deleteProduct;
