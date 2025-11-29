describe('checkout sessions and items', () => {
  afterEach(() => jest.resetModules());

  test('getCheckoutSession returns session on success', async () => {
    jest.resetModules();
    (global as any).prisma = { checkoutSession: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) } };
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ checkout: { sessions: { retrieve: jest.fn().mockResolvedValue({ id: 's1' }) } } }));
    });
    const { getCheckoutSession } = await import('../../controllers/checkout');
    const req: any = { params: { id: 's1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getCheckoutSession(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
  });

  test('getCheckoutSession next() on error', async () => {
    jest.resetModules();
    (global as any).prisma = { checkoutSession: { findUnique: jest.fn().mockRejectedValue(new Error('fail')) } };
    const { getCheckoutSession } = await import('../../controllers/checkout');
    const next = jest.fn();
    await getCheckoutSession({ params: { id: 's2' } } as any, {} as any, next as any);
    expect(next).toHaveBeenCalled();
  });
});
