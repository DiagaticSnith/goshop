describe('checkout additional branches', () => {
  afterEach(() => jest.resetModules());

  test('stock validation handles db error', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockRejectedValue(new Error('db fail')) } };
    const { createCheckoutSession } = await import('../../controllers/checkout');
    const req: any = { body: { lineItems: [{ price: 'price_1', quantity: 1 }], email: 'a@b.com', userId: 'u1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await createCheckoutSession(req, { status } as any, jest.fn());
    // controller logs error and returns 500 in this code path
    expect(status).toHaveBeenCalledWith(500);
  });
});
