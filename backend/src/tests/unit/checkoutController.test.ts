import { jest } from '@jest/globals';

const mockStripe: any = {
  checkout: { sessions: { retrieve: jest.fn(), listLineItems: jest.fn(), create: jest.fn() } }
};
const mockPrisma: any = { product: { findUnique: jest.fn() } };

jest.mock('../../config/stripe', () => ({ __esModule: true, default: mockStripe }));
jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import { getCheckoutSession, getCheckoutItems, createCheckoutSession } from '../../controllers/checkout';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Checkout controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getCheckoutSession returns 200 when stripe returns session', async () => {
    mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({ id: 's1' });
    const res = makeRes();
    await getCheckoutSession({ params: { id: 's1' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getCheckoutItems maps line items to products', async () => {
    mockStripe.checkout.sessions.listLineItems.mockResolvedValueOnce({ data: [{ price: { id: 'p1' }, quantity: 2 }] });
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'prod-1' });
    const res = makeRes();
    await getCheckoutItems({ params: { id: 's1' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createCheckoutSession returns 409 when insufficient stock', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 'p1', stockQuantity: 1, name: 'P' });
    const req: any = { body: { lineItems: [{ price: 'p1', quantity: 2 }] } };
    const res = makeRes();
    await createCheckoutSession(req, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('createCheckoutSession creates stripe session on success', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', stockQuantity: 5, name: 'P' });
    mockStripe.checkout.sessions.create.mockResolvedValueOnce({ id: 'sess-1', url: 'http://ok' });
    const req: any = { body: { lineItems: [{ price: 'p1', quantity: 1 }], email: 'a@b.com', userId: 'u1' } };
    const res = makeRes();
    await createCheckoutSession(req, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

export {};
