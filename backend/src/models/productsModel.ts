import prisma from '../config/prisma-client';

export const ProductsModel = {
  async getAllProducts() {
    return prisma.product.findMany();
  },

  async getProductById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async createProduct(data: any) {
    return prisma.product.create({ data });
  },

  async updateProduct(id: string, data: any) {
    return prisma.product.update({ where: { id }, data });
  },

  async deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  },
};
