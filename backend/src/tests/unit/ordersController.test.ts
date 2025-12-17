import { jest } from '@jest/globals';

const mockPrisma: any = {
  order: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
  orderDetails: { create: jest.fn() }
};
const mockStripe: any = { checkout: { sessions: { retrieve: jest.fn(), listLineItems: jest.fn() } }, refunds: { create: jest.fn() } };

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));

import { getAllOrders, getOrderById, confirmOrder, rejectOrder, getOrdersStats } from '../../controllers/orders';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Orders controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllOrders returns 200 with empty result', async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([]);
    mockPrisma.order.count.mockResolvedValueOnce(0);
    const res = makeRes();
    await getAllOrders({ query: {} } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getOrderById validates id and returns 400 when invalid', async () => {
    const res = makeRes();
    await getOrderById({ params: { id: 'not-a-number' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('confirmOrder returns 400 when order is rejected', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 1, status: 'REJECTED' });
    const res = makeRes();
    await confirmOrder({ params: { id: '1' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejectOrder attempts refund and marks rejected', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 2, status: 'PENDING', sessionId: 's1' });
    mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({ payment_intent: 'pi_1' });
    mockStripe.refunds.create.mockResolvedValueOnce({ id: 'r1' });
    mockPrisma.order.update.mockResolvedValueOnce({ id: 2, status: 'REJECTED' });
    const res = makeRes();
    await rejectOrder({ params: { id: '2' } } as any, res as any);
    expect(mockPrisma.order.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('getOrdersStats returns 200 with stats', async () => {
    mockPrisma.order.count.mockResolvedValueOnce(5);
    mockPrisma.order.aggregate.mockResolvedValueOnce({ _sum: { amount: 100 } });
    mockPrisma.order.findMany.mockResolvedValueOnce([]);
    const res = makeRes();
    await getOrdersStats({} as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getAllOrders applies status filter and numeric search', async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([]);
    mockPrisma.order.count.mockResolvedValueOnce(0);
    const req: any = { query: { status: 'confirmed', search: '123' } };
    const res = makeRes();
    await getAllOrders(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('confirmOrder returns 200 when already confirmed', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 5, status: 'CONFIRMED' });
    const res = makeRes();
    await confirmOrder({ params: { id: '5' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rejectOrder proceeds when stripe refund fails gracefully', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 6, status: 'PENDING', sessionId: 's1' });
    mockStripe.checkout.sessions.retrieve.mockRejectedValueOnce(new Error('stripe gone'));
    mockPrisma.order.update.mockResolvedValueOnce({ id: 6, status: 'REJECTED' });
    const res = makeRes();
    await rejectOrder({ params: { id: '6' } } as any, res as any);
    expect(res.json).toHaveBeenCalled();
  });
});

export {};
