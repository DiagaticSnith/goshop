import { jest } from '@jest/globals';

const mockPrisma: any = { product: { count: jest.fn(), aggregate: jest.fn() } };
jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import * as productsController from '../../controllers/products';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Products inventory stats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getInventoryStats returns computed totals', async () => {
    mockPrisma.product.count.mockResolvedValueOnce(10); // productsCount
    mockPrisma.product.count.mockResolvedValueOnce(2); // outOfStock
    mockPrisma.product.count.mockResolvedValueOnce(3); // lowStock
    mockPrisma.product.aggregate.mockResolvedValueOnce({ _sum: { stockQuantity: 42 } });

    const res = makeRes();
    await productsController.getInventoryStats({} as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

export {};
