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

describe('Products controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllProducts returns 200', async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([{ id: 'p1' }]);
    const res = makeRes();
    await productsController.getAllProducts({} as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getProductById returns 404 when not found', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);
    const res = makeRes();
    await productsController.getProductById({ params: { id: 'no' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('searchForProducts calls next on error', async () => {
    const next = jest.fn();
    mockPrisma.product.findMany.mockRejectedValueOnce(new Error('boom'));
    await productsController.searchForProducts({ body: { searchQuery: 'x' } } as any, makeRes() as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('createProduct returns 201 on success', async () => {
    mockStripe.products.create.mockResolvedValueOnce({ id: 's1', default_price: 'pr1' });
    mockPrisma.product.create.mockResolvedValueOnce({ id: 's1' });
    const req: any = { body: { name: 'N', description: 'D', price: 1, stockQuantity: 1, category: 'C' }, image: 'http://img' };
    const res = makeRes();
    await productsController.createProduct(req as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateProduct returns 404 when not found', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);
    const res = makeRes();
    await productsController.updateProduct({ params: { id: 'x' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteProduct returns 404 when missing', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce(null);
    const res = makeRes();
    await productsController.deleteProduct({ params: { id: 'x' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateProduct recreates stripe product when stripe update reports missing resource', async () => {
    const found = { id: 'old', image: 'img', price: 5 };
    mockPrisma.product.findFirst.mockResolvedValueOnce(found);
    // stripe.products.update throws resource_missing
    const err: any = new Error('not found'); err.type = 'StripeInvalidRequestError'; err.raw = { code: 'resource_missing' };
    mockStripe.products.update.mockRejectedValueOnce(err);
    mockStripe.products.create.mockResolvedValueOnce({ id: 'newid', default_price: 'newprice' });
    (mockStripe as any).prices = { create: () => Promise.resolve({ id: 'price_new' }) };
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'newid' });
    const req: any = { params: { id: 'old' }, body: { price: 10, stockQuantity: 1, name: 'N', description: 'D', category: 'C' }, image: undefined };
    const res = makeRes();
    await productsController.updateProduct(req as any, res as any, (()=>{}) as any);
    expect(mockStripe.products.create).toHaveBeenCalled();
    expect(mockPrisma.product.update).toHaveBeenCalled();
  });

  test('setProductStatus returns 400 for invalid status and 200 for hiding product', async () => {
    const res = makeRes();
    await productsController.setProductStatus({ params: { id: 'p1' }, body: { status: 'BAD' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(400);

    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'p1' });
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'p1', status: 'HIDDEN' });
    mockStripe.products.update.mockResolvedValueOnce({});
    const res2 = makeRes();
    await productsController.setProductStatus({ params: { id: 'p1' }, body: { status: 'HIDDEN' } } as any, res2 as any, (()=>{}) as any);
    expect(res2.status).toHaveBeenCalledWith(200);
  });

  test('getProductsByCategory returns 404 when none', async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce(null);
    const res = makeRes();
    await productsController.getProductsByCategory({ params: { id: '10' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

export {};
