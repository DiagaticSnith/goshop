import prisma from '../config/prisma-client';

export const ProductsModel = {
  async getAllProducts() {
  return prisma.product.findMany({ where: { status: 'ACTIVE' as any } });
  },

  async getProductById(id: string) {
  return prisma.product.findFirst({ where: { id, status: 'ACTIVE' as any } });
  },

  async createProduct(data: any) {
  return prisma.product.create({ data: { ...data, status: 'ACTIVE' as any } });
  },

  async updateProduct(id: string, data: any) {
  return prisma.product.update({ where: { id }, data });
  },

  async deleteProduct(id: string) {
  return prisma.product.update({ where: { id }, data: { status: 'HIDDEN' as any } });
  },
};
