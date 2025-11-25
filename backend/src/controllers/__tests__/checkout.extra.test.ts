describe('checkout controller edge cases', () => {
  afterEach(() => jest.resetModules());

  test('returns 400 when product for price not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue(null) } };
    const { createCheckoutSession } = await import('../checkout');
    const req: any = { body: { lineItems: [{ price: 'price_1', quantity: 1 }], email: 'a@b.com', userId: 'u1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await createCheckoutSession(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Product for price price_1 not found' });
  });

  test('returns 409 when insufficient stock', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', stockQuantity: 1, name: 'P' }) } };
    const { createCheckoutSession } = await import('../checkout');
    const req: any = { body: { lineItems: [{ price: 'price_1', quantity: 2 }], email: 'a@b.com', userId: 'u1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await createCheckoutSession(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ message: 'Insufficient stock for P' });
  });

  test('returns 500 when stock validation throws', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockRejectedValue(new Error('db fail')) } };
    const { createCheckoutSession } = await import('../checkout');
    const req: any = { body: { lineItems: [{ price: 'price_1', quantity: 2 }], email: 'a@b.com', userId: 'u1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await createCheckoutSession(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'Unable to validate stock' });
  });
});
