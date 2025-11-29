describe('products more branches', () => {
  afterEach(() => jest.resetModules());

  test('handles stripe missing product branch', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue({ id: 'old_id', name: 'Old' }), findFirst: jest.fn().mockResolvedValue({ id: 'old_id', name: 'Old' }), update: jest.fn().mockResolvedValue({ id: 'old_id' }) } };
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({
        products: {
          retrieve: jest.fn().mockRejectedValue({ type: 'StripeInvalidRequestError', raw: { code: 'resource_missing' }, message: 'missing' }),
          create: jest.fn().mockResolvedValue({ id: 'new', default_price: 'p_new' }),
          update: jest.fn().mockResolvedValue({ id: 'updated' })
        },
        prices: {
          create: jest.fn().mockResolvedValue({ id: 'p_new' })
        }
      }));
    });
    const { updateProduct } = await import('../../controllers/products');
    const req: any = { params: { id: 'old_id' }, body: { name: 'New' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await updateProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalled();
  });
});
