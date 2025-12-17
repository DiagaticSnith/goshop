import { jest } from '@jest/globals';

const mockStripe: any = {
  webhooks: { constructEvent: jest.fn() },
  checkout: { sessions: { listLineItems: jest.fn() } }
};
const mockPrisma: any = { product: { findUnique: jest.fn() }, $transaction: jest.fn(), order: { findUnique: jest.fn() }, cart: { findUnique: jest.fn() }, cartItem: { deleteMany: jest.fn() } };

jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));
jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import { webhook } from '../../controllers/webhook';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Webhook controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when signature invalid', async () => {
    mockStripe.webhooks.constructEvent.mockImplementationOnce(() => { throw new Error('sig'); });
    const req: any = { headers: { 'stripe-signature': 's' }, body: Buffer.from('x') };
    const res = makeRes();
    await webhook(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 for non checkout event', async () => {
    mockStripe.webhooks.constructEvent.mockResolvedValueOnce({ type: 'something.else' });
    const req: any = { headers: { 'stripe-signature': 's' }, body: Buffer.from('x') };
    const res = makeRes();
    await webhook(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('checkout.session.completed path creates order and returns 201', async () => {
    const session = { id: 's1', amount_total: 1000, metadata: { customerId: 'u1' }, created: Math.floor(Date.now()/1000) };
    mockStripe.webhooks.constructEvent.mockImplementationOnce(() => ({ type: 'checkout.session.completed', data: { object: session } }));
    mockStripe.checkout.sessions.listLineItems.mockResolvedValueOnce({ data: [{ price: { id: 'price1' }, quantity: 1 }] });
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'p1', price: 10 });
    mockPrisma.$transaction.mockImplementationOnce(async (fn: any) => ({ id: 123 }));
    mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 123 });
    mockPrisma.cart.findUnique.mockResolvedValueOnce({ id: 'cart-1', items: [] });
    const req: any = { headers: { 'stripe-signature': 's' }, body: Buffer.from('x') };
    const res = makeRes();
    await webhook(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

export {};
