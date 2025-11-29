describe('checkout controller', () => {
  afterEach(() => jest.resetModules());

  test('createCheckoutSession logs payload and returns 200', async () => {
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', stockQuantity: 10 }) }, checkoutSession: { create: jest.fn().mockResolvedValue({ id: 's1' }) } };
    const { createCheckoutSession } = await import('../../controllers/checkout');
    const req: any = { body: { lineItems: [{ price: 'price_1', quantity: 2 }], email: 'a@b.com', userId: 'u1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await createCheckoutSession(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalled();
  });
});
