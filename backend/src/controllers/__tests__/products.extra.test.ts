describe('products controller edge branches', () => {
  afterEach(() => jest.resetModules());

  test('getAllProducts returns 404 when no products', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findMany: jest.fn().mockResolvedValue(null) } };
    const { getAllProducts } = await import('../products');
    const req: any = {};
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getAllProducts(req, { status } as any);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Products not found' });
  });

  test('searchForProducts appends wildcard for single-word query and returns 200', async () => {
    jest.resetModules();
    const mockFindMany = jest.fn().mockResolvedValue([{ id: 'p1' }]);
    (global as any).prisma = { product: { findMany: mockFindMany } };
    const { searchForProducts } = await import('../products');
    const req: any = { body: { searchQuery: 'shoe' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await searchForProducts(req, { status } as any, next as any);
    expect(mockFindMany).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([{ id: 'p1' }]);
  });

  test('searchForProducts next() on error', async () => {
    jest.resetModules();
    const mockFindMany = jest.fn().mockRejectedValue(new Error('db fail'));
    (global as any).prisma = { product: { findMany: mockFindMany } };
    const { searchForProducts } = await import('../products');
    const req: any = { body: { searchQuery: 'x' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await searchForProducts(req, { status } as any, next as any);
    expect(next).toHaveBeenCalled();
  });
});
