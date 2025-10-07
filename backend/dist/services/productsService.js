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
exports.ProductsService = void 0;
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const stripe_1 = __importDefault(require("../config/stripe"));
exports.ProductsService = {
    getAllProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_client_1.default.product.findMany({ orderBy: { createdAt: 'desc' } });
        });
    },
    getProductById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_client_1.default.product.findUnique({ where: { id } });
        });
    },
    searchForProducts(searchQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            if (searchQuery.length > 0 && searchQuery.indexOf(' ') === -1) {
                searchQuery = `${searchQuery}*`;
            }
            return prisma_client_1.default.product.findMany({
                where: {
                    name: { search: searchQuery },
                    description: { search: searchQuery }
                },
                orderBy: {
                    _relevance: {
                        fields: ['name'],
                        search: 'database',
                        sort: 'asc'
                    }
                }
            });
        });
    },
    getProductsByCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_client_1.default.product.findMany({
                where: { categoryId },
                orderBy: { createdAt: 'desc' }
            });
        });
    },
    createProduct(body, image) {
        return __awaiter(this, void 0, void 0, function* () {
            const stripeProduct = yield stripe_1.default.products.create({
                name: body.name,
                description: body.description,
                default_price_data: {
                    currency: 'usd',
                    unit_amount: body.price * 100
                },
                images: [image]
            });
            return prisma_client_1.default.product.create({
                data: {
                    stockQuantity: Number(body.stockQuantity),
                    price: Number(body.price),
                    id: stripeProduct.id,
                    priceId: stripeProduct.default_price,
                    image,
                    name: body.name,
                    description: body.description,
                    category: {
                        connectOrCreate: {
                            where: { name: body.category },
                            create: { name: body.category }
                        }
                    }
                }
            });
        });
    },
    updateProduct(id, body, image) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundProduct = yield prisma_client_1.default.product.findFirst({ where: { id } });
            if (!foundProduct)
                return null;
            yield stripe_1.default.products.update(foundProduct.id, { active: false });
            const finalImage = image || foundProduct.image;
            const updatedStripeProduct = yield stripe_1.default.products.create({
                name: (body === null || body === void 0 ? void 0 : body.name) || foundProduct.name,
                description: (body === null || body === void 0 ? void 0 : body.description) || foundProduct.description,
                default_price_data: {
                    currency: 'usd',
                    unit_amount: ((body === null || body === void 0 ? void 0 : body.price) || foundProduct.price) * 100
                },
                images: [finalImage]
            });
            return prisma_client_1.default.product.update({
                where: { id },
                data: {
                    stockQuantity: Number(body.stockQuantity),
                    price: Number(body.price),
                    id: updatedStripeProduct.id,
                    priceId: updatedStripeProduct.default_price,
                    image: finalImage,
                    name: body.name,
                    description: body.description,
                    category: {
                        connectOrCreate: {
                            where: { name: body.category },
                            create: { name: body.category }
                        }
                    }
                }
            });
        });
    },
    deleteProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletedProduct = yield prisma_client_1.default.product.delete({ where: { id } });
            if (!deletedProduct)
                return null;
            yield prisma_client_1.default.category.deleteMany({
                where: { products: { none: {} } }
            });
            yield stripe_1.default.products.update(id, { active: false });
            return deletedProduct;
        });
    }
};
