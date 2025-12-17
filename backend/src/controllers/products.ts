import stripe from "../config/stripe";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma-client";

// Return true if value is an absolute http/https URL
const isUrl = (val: any): boolean => {
    return typeof val === 'string' && /^https?:\/\//i.test(val);
};

export const getAllProducts = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' as any },
        include: {
            category: true
        },
        // Default listing ordered by price (high -> low) to match frontend expectations in tests
        orderBy: {
            price: "desc"
        }
    });

    if (!products) {
        return res.status(404).json({ message: "Products not found" });
    }

    res.status(200).json(products);
};

// Admin: get all products (including hidden)
export const getAllProductsAdmin = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(products);
};

export const getProductById = async (req: Request, res: Response) => {
    const product = await prisma.product.findFirst({
        where: { id: req.params.id, status: 'ACTIVE' as any },
        include: { category: true }
    });

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
};

export const searchForProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { searchQuery } = req.body;
        if (searchQuery.length > 0 && searchQuery.indexOf(" ") === -1) {
            searchQuery = `${searchQuery}*`;
        }
        const products = await prisma.product.findMany({
            where: {
                status: 'ACTIVE' as any,
                OR: [
                    { name: { search: searchQuery } },
                    { description: { search: searchQuery } }
                ]
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
    } catch (error) {
        next({ message: "Unable to search for products", error });
    }
};


export const getProductsByCategory = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        where: {
            categoryId: Number(req.params.id),
            status: 'ACTIVE' as any
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    if (!products) {
        return res.status(404).json({ message: "Products not found" });
    }
    
    res.status(200).json(products);
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
    const image = req.image || undefined;
    // Prisma requires a non-null `image`; use empty string in DB if upload failed.
    const imageForDb = req.image || "";
        const stripePayload: any = {
            name: req.body.name,
            description: req.body.description,
            default_price_data: {
                currency: "usd",
                unit_amount: Math.round(Number(req.body.price) * 100)
            }
        };
    if (image && isUrl(image)) stripePayload.images = [image];
        const stripeProduct = await stripe.products.create(stripePayload);
    
        const newProduct = await prisma.product.create({
            data: ({
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: stripeProduct.id,
                priceId: stripeProduct.default_price as string,
                image: imageForDb,
                name: req.body.name,
                description: req.body.description,
                status: 'ACTIVE' as any,
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
            } as any)
        });
    
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('createProduct error', error);
        next({ message: "Unable to create the product with given details", error });
    }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const foundProduct = await prisma.product.findFirst({
            where: {
                id: req.params.id
            }
        });

        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        const image = req.image || foundProduct.image || undefined;
        // For DB write, ensure non-null image value
        const imageForDb = req.image || foundProduct.image || "";

        let stripeProductId = foundProduct.id;
        let newPriceId: string | undefined = undefined;

        // Try to update existing Stripe product metadata
        try {
            const updatePayload: any = {
                name: req.body?.name || foundProduct.name,
                description: req.body?.description || foundProduct.description
            };
            if (image && isUrl(image)) updatePayload.images = [image];
            await stripe.products.update(foundProduct.id, updatePayload);
        } catch (err: any) {
            // If the Stripe product is missing, create a new one and we'll update DB id below.
            if (err && (err.type === 'StripeInvalidRequestError' || err.raw?.code === 'resource_missing')) {
                console.warn(`Stripe product not found when attempting to update id=${foundProduct.id}, recreating product:`, err.message || err);
                const createdStripeProduct = await stripe.products.create({
                    name: req.body?.name || foundProduct.name,
                    description: req.body?.description || foundProduct.description,
                    default_price_data: {
                        currency: 'usd',
                        unit_amount: Math.round((req.body?.price || foundProduct.price) * 100)
                    },
                    ...(image && isUrl(image) ? { images: [image] } : {})
                });
                stripeProductId = createdStripeProduct.id;
                newPriceId = createdStripeProduct.default_price as string;
            } else {
                throw err;
            }
        }

        // If price changed (or we created a new product), create a new Price for the stripe product
        try {
            const requestedPrice = Number(req.body.price || foundProduct.price);
            if (newPriceId === undefined && requestedPrice !== Number(foundProduct.price)) {
                const priceObj = await stripe.prices.create({
                    product: stripeProductId,
                    unit_amount: Math.round(requestedPrice * 100),
                    currency: 'usd'
                });
                newPriceId = priceObj.id;
            }
        } catch (err) {
            // if price create fails for unexpected reasons, rethrow to middleware
            throw err;
        }

        // Prepare DB update data; only change product id in DB if we recreated the Stripe product
        const dbUpdateData: any = {
            stockQuantity: Number(req.body.stockQuantity),
            price: Number(req.body.price),
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
                    where: { name: req.body.category },
                    create: { name: req.body.category }
                }
            }
        } as any;
        if (newPriceId) dbUpdateData.priceId = newPriceId;
        if (stripeProductId !== foundProduct.id) dbUpdateData.id = stripeProductId;

        const updatedProduct = await prisma.product.update({
            where: { id: req.params.id },
            data: dbUpdateData
        });
    
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('updateProduct error', error);
        next({ message: "Unable to update the product with given details", error });
    }    
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ message: 'Product not found' });

        const updated = await prisma.product.update({
            where: { id: req.params.id },
            data: { status: 'HIDDEN' as any }
        });

        // Keep Stripe product inactive
        try { await stripe.products.update(req.params.id, { active: false }); } catch {}
        res.status(200).json(updated);
    } catch (error) {
        next({ message: "Unable to delete the product", error });
    }
};

// Admin: set product status (ACTIVE/HIDDEN)
export const setProductStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body as { status?: 'ACTIVE' | 'HIDDEN' };
        if (!status || (status !== 'ACTIVE' && status !== 'HIDDEN')) {
            return res.status(400).json({ message: 'Invalid status. Use ACTIVE or HIDDEN.' });
        }
        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ message: 'Product not found' });
        const updated = await prisma.product.update({ where: { id: req.params.id }, data: { status: status as any } });
        try {
            // Keep Stripe product inactive when hidden; do nothing when active
            if (status === 'HIDDEN') {
                await stripe.products.update(req.params.id, { active: false });
            }
        } catch {}
        res.status(200).json(updated);
    } catch (error) {
        next({ message: 'Unable to set product status', error });
    }
};

// Admin: inventory statistics (counts and stock summary)
export const getInventoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [productsCount, outOfStockCount, lowStockCount, stockAggregate] = await Promise.all([
            prisma.product.count({ where: { status: 'ACTIVE' as any } }),
            prisma.product.count({ where: { stockQuantity: 0, status: 'ACTIVE' as any } }),
            prisma.product.count({ where: { stockQuantity: { lte: 5 }, status: 'ACTIVE' as any } }),
            prisma.product.aggregate({ _sum: { stockQuantity: true }, where: { status: 'ACTIVE' as any } })
        ]);

        const totalStock = stockAggregate._sum.stockQuantity || 0;
        return res.status(200).json({
            productsCount,
            totalStock,
            outOfStockCount,
            lowStockCount
        });
    } catch (error) {
        next({ message: "Unable to compute inventory stats", error });
    }
};
