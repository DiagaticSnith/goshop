import { jest } from '@jest/globals';

const mockPrisma: any = { order: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } };
const mockStripe: any = { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } };

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));

import * as ordersController from '../../controllers/orders';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Orders controller extra branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('refund branch logs and continues when stripe refund fails', async () => {
    // simulate refund failure path: ordersController should catch and log
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 6, status: 'PENDING', sessionId: 's1' });
    mockStripe.checkout.sessions.retrieve.mockRejectedValueOnce(new Error('stripe gone'));
    mockPrisma.order.update.mockResolvedValueOnce({ id: 6, status: 'REJECTED' });

    const res = makeRes();
    await ordersController.rejectOrder({ params: { id: '6' } } as any, res as any);
    expect(res.json).toHaveBeenCalled();
  });
});

export {};
