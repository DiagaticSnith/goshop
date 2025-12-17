import { jest } from '@jest/globals';

const mockPrisma: any = { product: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() } };
const mockStripe: any = { products: { update: jest.fn(), create: jest.fn() }, prices: { create: jest.fn() } };

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));

import * as productsController from '../../controllers/products';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Products controller more branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updateProduct with no price change does not create new price', async () => {
    const found = { id: 'p1', image: 'img', price: 10 };
    mockPrisma.product.findFirst.mockResolvedValueOnce(found);
    mockStripe.products.update.mockResolvedValueOnce({});
    mockPrisma.product.update.mockResolvedValueOnce({ id: 'p1' });

    const req: any = { params: { id: 'p1' }, body: { price: 10, stockQuantity: 1, name: 'N', description: 'D', category: 'C' }, image: undefined };
    const res = makeRes();
    await productsController.updateProduct(req as any, res as any, (()=>{}) as any);

    expect(mockStripe.prices.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createProduct does not include images when image is local path', async () => {
    const created = { id: 's1', default_price: 'pr1' };
    mockStripe.products.create.mockResolvedValueOnce(created);
    mockPrisma.product.create.mockResolvedValueOnce({ id: 's1' });

    const req: any = { body: { name: 'N', description: 'D', price: 1, stockQuantity: 1, category: 'C' }, image: '/local/avatar.png' };
    const res = makeRes();
    await productsController.createProduct(req as any, res as any, (()=>{}) as any);

    // Ensure stripe.create called and images not passed for non-http image
    expect(mockStripe.products.create).toHaveBeenCalled();
    const payload = (mockStripe.products.create as jest.Mock).mock.calls[0][0] as any;
    expect(payload.images).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

export {};
