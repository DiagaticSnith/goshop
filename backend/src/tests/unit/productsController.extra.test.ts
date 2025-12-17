import { jest } from '@jest/globals';

const mockPrisma: any = {
  product: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() }
};
const mockStripe: any = { products: { create: jest.fn(), update: jest.fn() }, prices: { create: jest.fn() } };

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));

import * as productsController from '../../controllers/products';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Products controller extra branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('createProduct calls next when stripe create fails', async () => {
    const next = jest.fn();
    mockStripe.products.create.mockRejectedValueOnce(new Error('stripe down'));
    const req: any = { body: { name: 'N', description: 'D', price: 1, stockQuantity: 1, category: 'C' }, image: 'http://img' };
    await productsController.createProduct(req as any, makeRes() as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('updateProduct throws to next when stripe.prices.create fails on price change', async () => {
    const next = jest.fn();
    const found = { id: 'p_old', image: 'img', price: 5 };
    mockPrisma.product.findFirst.mockResolvedValueOnce(found);
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'p_old' });
    mockStripe.products.update.mockResolvedValueOnce({});
    // Simulate prices.create failing
    mockStripe.prices.create.mockRejectedValueOnce(new Error('price fail'));

    const req: any = { params: { id: 'p_old' }, body: { price: 10, stockQuantity: 1, name: 'N', description: 'D', category: 'C' }, image: undefined };
    await productsController.updateProduct(req as any, makeRes() as any, next as any);
    // since prices.create throws, updateProduct should propagate to catch and call next
    expect(next).toHaveBeenCalled();
  });

  test('deleteProduct still returns 200 when stripe.products.update throws', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'p1' });
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'p1', status: 'HIDDEN' });
    mockStripe.products.update.mockRejectedValueOnce(new Error('stripe fail'));
    const res = makeRes();
    const next = jest.fn();
    await productsController.deleteProduct({ params: { id: 'p1' } } as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

export {};
