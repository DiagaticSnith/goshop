import { ProductsModel } from '../models/productsModel';
import prisma from '../config/prisma-client';
import stripe from '../config/stripe';

export const ProductsService = {
  async getAllProducts() {
    return prisma.product.findMany({ where: { status: 'ACTIVE' as any }, orderBy: { createdAt: 'desc' } });
  },

  async getProductById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async searchForProducts(searchQuery: string) {
    if (searchQuery.length > 0 && searchQuery.indexOf(' ') === -1) {
      searchQuery = `${searchQuery}*`;
    }
    return prisma.product.findMany({
      where: {
        status: 'ACTIVE' as any,
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
  },

  async getProductsByCategory(categoryId: number) {
    return prisma.product.findMany({
      where: { categoryId, status: 'ACTIVE' as any },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createProduct(body: any, image: string) {
    const stripeProduct = await stripe.products.create({
      name: body.name,
      description: body.description,
      default_price_data: {
        currency: 'usd',
        unit_amount: body.price * 100
      },
      images: [image]
    });
    return prisma.product.create({
      data: {
        stockQuantity: Number(body.stockQuantity),
        price: Number(body.price),
        id: stripeProduct.id,
        priceId: stripeProduct.default_price as string,
        image,
        name: body.name,
        description: body.description,
        status: 'ACTIVE' as any,
        category: {
          connectOrCreate: {
            where: { name: body.category },
            create: { name: body.category }
          }
        }
      }
    });
  },

  async updateProduct(id: string, body: any, image: string | undefined) {
    const foundProduct = await prisma.product.findFirst({ where: { id } });
    if (!foundProduct) return null;
    await stripe.products.update(foundProduct.id, { active: false });
    const finalImage = image || foundProduct.image;
    const updatedStripeProduct = await stripe.products.create({
      name: body?.name || foundProduct.name,
      description: body?.description || foundProduct.description,
      default_price_data: {
        currency: 'usd',
        unit_amount: (body?.price || foundProduct.price) * 100
      },
      images: [finalImage]
    });
    return prisma.product.update({
      where: { id },
      data: {
        stockQuantity: Number(body.stockQuantity),
        price: Number(body.price),
        id: updatedStripeProduct.id,
        priceId: updatedStripeProduct.default_price as string,
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
  },

  async deleteProduct(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return null;
    const updated = await prisma.product.update({ where: { id }, data: { status: 'HIDDEN' as any } });
    try { await stripe.products.update(id, { active: false }); } catch {}
    return updated;
  }
};
