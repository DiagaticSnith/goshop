import { createCheckoutSession } from '../checkout';

describe('checkout controller', () => {
  afterEach(() => jest.resetModules());

  test('createCheckoutSession creates session when stock is sufficient', async () => {
    // Mock prisma product.findUnique to return product with sufficient stock
    // set mocked global.prisma so prisma-client returns it instead of creating a real client
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', name: 'Toy', stockQuantity: 5 }) } };

    // Mock the 'stripe' package so config/stripe creates a fake client
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({
        checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: 'sess_1', url: 'https://stripe/checkout/sess_1' }) }, listLineItems: jest.fn() },
        products: { create: jest.fn(), update: jest.fn() },
        prices: { create: jest.fn() }
      }));
    });

    const { createCheckoutSession } = await import('../checkout');

    const req: any = {
      body: { lineItems: [{ price: 'price_1', quantity: 2 }], email: 'a@b.com', userId: 'u1', address: 'addr' }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    await createCheckoutSession(req, { status } as any, jest.fn());

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'sess_1', url: 'https://stripe/checkout/sess_1' }));
  });

  test('createCheckoutSession returns 409 when insufficient stock', async () => {
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: 'p2', name: 'LargeToy', stockQuantity: 1 }) } };

    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ checkout: { sessions: { create: jest.fn() } } }));
    });

    const { createCheckoutSession } = await import('../checkout');
    const req: any = { body: { lineItems: [{ price: 'price_2', quantity: 3 }] } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    await createCheckoutSession(req, { status } as any, jest.fn());

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Insufficient stock') }));
  });
});
