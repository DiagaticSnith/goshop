import { jest } from '@jest/globals';

// Provide mutable mock objects for prisma and stripe before importing the service
const mockPrisma: any = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
};

const mockStripe: any = {
  products: { create: jest.fn(), update: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  refunds: { create: jest.fn() }
};

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));

import { ProductsService } from '../../services/productsService';

describe('ProductsService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllProducts returns list from prisma', async () => {
    const rows = [{ id: 'p1', name: 'A' }];
    mockPrisma.product.findMany.mockResolvedValueOnce(rows);
    const res = await ProductsService.getAllProducts();
    expect(res).toBe(rows);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'ACTIVE' } }));
  });

  test('getProductById returns single product', async () => {
    const p = { id: 'p1', name: 'P1' };
    mockPrisma.product.findUnique.mockResolvedValueOnce(p);
    const res = await ProductsService.getProductById('p1');
    expect(res).toBe(p);
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  test('searchForProducts calls prisma with search pattern', async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([{ id: 'p2', name: 'Bàn' }]);
    const results = await ProductsService.searchForProducts('Bàn');
    expect(results).toEqual([{ id: 'p2', name: 'Bàn' }]);
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
    const calledArg = mockPrisma.product.findMany.mock.calls[0][0];
    expect(calledArg.where).toHaveProperty('name');
    expect(calledArg.where.name).toHaveProperty('search');
  });

  test('createProduct calls stripe and prisma.create', async () => {
    const body = { name: 'X', description: 'd', price: 12, stockQuantity: 3, category: 'C' };
    mockStripe.products.create.mockResolvedValueOnce({ id: 'stripe-1', default_price: 'price-1' });
    mockPrisma.product.create.mockResolvedValueOnce({ id: 'stripe-1', priceId: 'price-1' });

    const res = await ProductsService.createProduct(body, 'http://img');
    expect(mockStripe.products.create).toHaveBeenCalled();
    expect(mockPrisma.product.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'stripe-1', priceId: 'price-1' }) }));
    expect(res).toEqual({ id: 'stripe-1', priceId: 'price-1' });
  });

  test('updateProduct returns null when not found', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);
    const res = await ProductsService.updateProduct('nope', {}, undefined);
    expect(res).toBeNull();
  });

  test('updateProduct updates when found and calls stripe', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce({ id: 'p1', image: 'img.png', price: 5 });
    mockStripe.products.update.mockResolvedValueOnce({});
    mockStripe.products.create.mockResolvedValueOnce({ id: 'newstripe', default_price: 'pnew' });
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'newstripe', priceId: 'pnew' });
    const out = await ProductsService.updateProduct('p1', { name: 'New', price: 10, stockQuantity: 2, category: 'C' }, undefined);
    expect(mockStripe.products.update).toHaveBeenCalled();
    expect(mockStripe.products.create).toHaveBeenCalled();
    expect(mockPrisma.product.update).toHaveBeenCalled();
    expect(out).toEqual({ id: 'newstripe', priceId: 'pnew' });
  });

  test('searchForProducts preserves query with space (no wildcard append)', async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);
    const q = 'multi word';
    const res = await ProductsService.searchForProducts(q);
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
    const calledArg = mockPrisma.product.findMany.mock.calls[0][0];
    expect(calledArg.where.name.search).toBe(q);
  });

  test('deleteProduct still returns update when stripe update throws', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'pdel' });
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'pdel', status: 'HIDDEN' });
    mockStripe.products.update.mockRejectedValueOnce(new Error('stripe fail'));
    const out = await ProductsService.deleteProduct('pdel');
    expect(out).toEqual({ id: 'pdel', status: 'HIDDEN' });
  });

  test('deleteProduct hides product and attempts stripe update', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'pdel' });
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'pdel', status: 'HIDDEN' });
    mockStripe.products.update.mockResolvedValueOnce({ id: 'pdel' });

    const out = await ProductsService.deleteProduct('pdel');
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'pdel' } });
    expect(mockPrisma.product.update).toHaveBeenCalledWith({ where: { id: 'pdel' }, data: { status: 'HIDDEN' } });
    expect(out).toEqual({ id: 'pdel', status: 'HIDDEN' });
  });
});

export {};
