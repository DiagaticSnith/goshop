describe('products controller (basic branches)', () => {
  afterEach(() => jest.resetModules());

  test('search and basic flows', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn().mockResolvedValue(null) } };
    const { getProductsByCategory, getProductById } = await import('../../controllers/products');
    const status = jest.fn(() => ({ json: jest.fn() }));
    await getProductsByCategory({ params: { id: '1' } } as any, { status } as any);
    await getProductById({ params: { id: 'no' } } as any, { status } as any);
    expect(status).toHaveBeenCalled();
  });
});
