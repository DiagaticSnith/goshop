describe('products extra branches', () => {
  afterEach(() => jest.resetModules());

  test('getProductsByCategory not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findMany: jest.fn().mockResolvedValue(null) } };
    const { getProductsByCategory } = await import('../../controllers/products');
    const status = jest.fn(() => ({ json: jest.fn() }));
    await getProductsByCategory({ params: { id: '10' } } as any, { status } as any);
    expect(status).toHaveBeenCalled();
  });
});
