import { jest } from '@jest/globals';

const mockPrisma: any = { order: { findUnique: jest.fn() } };
jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import * as ordersController from '../../controllers/orders';

const makeReq = (uid: string) => ({ params: { id: '1' }, uid, role: 'USER' });
const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Orders controller forbidden branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getOrderById returns 403 for non-owner non-admin', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 'o1', userId: 'u1' });
    const req: any = makeReq('u2');
    const res = makeRes();
    await ordersController.getOrderById(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

export {};
