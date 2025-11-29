describe('createProduct and getProduct branches', () => {
  afterEach(() => jest.resetModules());

  test('createProduct success with image URL', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { create: jest.fn().mockResolvedValue({ id: 'p_new' }) } };
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ products: { create: jest.fn().mockResolvedValue({ id: 's_prod', default_price: 'p_default' }) } }));
    });
    const { createProduct } = await import('../../controllers/products');
    const req: any = { body: { name: 'X', description: 'd', price: '12', stockQuantity: '3', category: 'C' }, image: 'https://img' };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await createProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ id: 'p_new' });
  });

  test('createProduct next() on stripe create failure', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { create: jest.fn() } };
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ products: { create: jest.fn().mockRejectedValue(new Error('stripe err')) } }));
    });
    const { createProduct } = await import('../../controllers/products');
    const req: any = { body: { name: 'X', description: 'd', price: '12', stockQuantity: '3', category: 'C' } };
    const next = jest.fn();
    await createProduct(req, {} as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('getProductById returns 404 when not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findFirst: jest.fn().mockResolvedValue(null) } };
    const { getProductById } = await import('../../controllers/products');
    const req: any = { params: { id: 'no' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getProductById(req, { status } as any);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Product not found' });
  });

  test('getProductsByCategory returns 404 when not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findMany: jest.fn().mockResolvedValue(null) } };
    const { getProductsByCategory } = await import('../../controllers/products');
    const req: any = { params: { id: '10' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getProductsByCategory(req, { status } as any);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Products not found' });
  });
});
