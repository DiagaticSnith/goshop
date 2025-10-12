import stripe from "../config/stripe";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma-client";

// Return true if value is an absolute http/https URL
const isUrl = (val: any): boolean => {
    return typeof val === 'string' && /^https?:\/\//i.test(val);
};

export const getAllProducts = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
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
};

export const getProductById = async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            category: true
        }
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
    } catch (error) {
        next({ message: "Unable to search for products", error });
    }
};


export const getProductsByCategory = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
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
    
        try {
            await stripe.products.update(foundProduct.id, {
                active: false
            });
        } catch (err: any) {
            // If the Stripe product was already deleted/doesn't exist, don't fail the whole request.
            // Log and continue to create a new Stripe product below.
            if (err && (err.type === 'StripeInvalidRequestError' || err.raw?.code === 'resource_missing')) {
                console.warn(`Stripe product not found when attempting to deactivate id=${foundProduct.id}, continuing to recreate:`, err.message || err);
            } else {
                // rethrow unknown Stripe errors so they can be handled by error middleware
                throw err;
            }
        }
        
    const image = req.image || foundProduct.image || undefined;
    // For DB write, ensure non-null image value
    const imageForDb = req.image || foundProduct.image || "";
        const updatedStripePayload: any = {
            name: req.body?.name || foundProduct.name,
            description: req.body?.description || foundProduct.description,
            default_price_data: {
                currency: "usd",
                unit_amount: Math.round((req.body?.price || foundProduct.price) * 100)
            }
        };
    if (image && isUrl(image)) updatedStripePayload.images = [image];
        const updatedStripeProduct = await stripe.products.create(updatedStripePayload);
    
        const updatedProduct = await prisma.product.update({
            where: {
                id: req.params.id
            },
            data: ({
                stockQuantity: Number(req.body.stockQuantity),
                price: Number(req.body.price),
                id: updatedStripeProduct.id,
                priceId: updatedStripeProduct.default_price as string,
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
            } as any)
        });
    
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('updateProduct error', error);
        next({ message: "Unable to update the product with given details", error });
    }    
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedProduct = await prisma.product.delete({
            where: {
                id: req.params.id
            }
        });

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Do NOT auto-delete categories when a product is deleted.
        // Categories should be managed explicitly via the categories management UI.
        await stripe.products.update(req.params.id, {
            active: false
        });
    
        res.status(200).json(deletedProduct);
    } catch (error) {
        next({ message: "Unable to delete the product", error });
    }
};
