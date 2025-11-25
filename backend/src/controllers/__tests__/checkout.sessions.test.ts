describe('checkout sessions and items', () => {
  afterEach(() => jest.resetModules());

  test('getCheckoutSession returns session on success', async () => {
    jest.resetModules();
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ checkout: { sessions: { retrieve: jest.fn().mockResolvedValue({ id: 'sess1' }) } } }));
    });
    const { getCheckoutSession } = await import('../checkout');
    const req: any = { params: { id: 'sess1' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getCheckoutSession(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ id: 'sess1' });
  });

  test('getCheckoutSession next() on error', async () => {
    jest.resetModules();
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ checkout: { sessions: { retrieve: jest.fn().mockRejectedValue(new Error('stripe fail')) } } }));
    });
    const { getCheckoutSession } = await import('../checkout');
    const req: any = { params: { id: 'sessX' } };
    const next = jest.fn();
    await getCheckoutSession(req, {} as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('getCheckoutItems maps line items to products', async () => {
    jest.resetModules();
    const lineItems = { data: [{ price: { id: 'price_1' }, quantity: 2 }, { price: { id: 'price_2' }, quantity: 1 }] };
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ checkout: { sessions: { listLineItems: jest.fn().mockResolvedValue(lineItems) } } }));
    });
    (global as any).prisma = { product: { findUnique: jest.fn().mockImplementation(({ where }) => ({ id: where.priceId === 'price_1' ? 'p1' : null })) } };
    const { getCheckoutItems } = await import('../checkout');
    const req: any = { params: { id: 's' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getCheckoutItems(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ productId: 'p1', quantity: 2 }, { productId: null, quantity: 1 }]);
  });
});
