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
const falso_1 = require("@ngneat/falso");
const prisma_client_1 = __importDefault(require("./config/prisma-client"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "../.env" });
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2022-11-15",
    typescript: true
});
const seedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = ["Electronics", "Accessories", "Home", "Food", "Furniture", "Books", "Gaming", "Fashion", "Sports", "Beauty"];
    yield prisma_client_1.default.category.deleteMany();
    yield prisma_client_1.default.product.deleteMany();
    const fakeProducts = (0, falso_1.randProduct)({ length: 100 });
    for (let i = 0; i < fakeProducts.length; i++) {
        const product = fakeProducts[i];
        const stripeProduct = yield stripe.products.create({
            name: product.title,
            description: product.description,
            default_price_data: {
                currency: "usd",
                unit_amount: Number((Number(product.price) * 100).toFixed(2))
            },
            images: [product.image]
        });
        const category = categories[Math.floor(Math.random() * 10)];
        yield prisma_client_1.default.product.create({
            data: {
                id: stripeProduct.id,
                name: product.title,
                description: product.description,
                price: Number(product.price),
                stockQuantity: Math.floor(Math.random() * 100),
                priceId: stripeProduct.default_price,
                image: product.image,
                category: {
                    connectOrCreate: {
                        where: {
                            name: category
                        },
                        create: {
                            name: category
                        }
                    }
                }
            }
        });
    }
});
seedProducts()
    .then(() => console.log("Populated data succesfully"))
    .catch(err => console.log(err));
