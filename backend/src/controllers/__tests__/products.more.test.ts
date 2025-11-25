describe('products controller - additional branches', () => {
  afterEach(() => jest.resetModules());

  test('updateProduct returns 404 when product not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findFirst: jest.fn().mockResolvedValue(null) } };
    const { updateProduct } = await import('../products');
    const req: any = { params: { id: 'p1' }, body: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await updateProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Product not found' });
  });

  test('updateProduct recreates stripe product when stripe update signals missing resource', async () => {
    jest.resetModules();
    const found = { id: 'old_id', price: 10, priceId: 'old_price', image: '', name: 'Old', description: '', stockQuantity: 5 };
    const mockFindFirst = jest.fn().mockResolvedValue(found);
    const mockUpdateDb = jest.fn().mockResolvedValue({ id: 'new_id' });
    (global as any).prisma = { product: { findFirst: mockFindFirst, update: mockUpdateDb } };

    // Mock stripe: update throws resource_missing, create returns new product with default_price
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({
        products: {
          update: jest.fn().mockRejectedValue({ type: 'StripeInvalidRequestError', message: 'missing', raw: { code: 'resource_missing' } }),
          create: jest.fn().mockResolvedValue({ id: 'new_stripe_id', default_price: 'new_price' })
        },
        prices: { create: jest.fn().mockResolvedValue({ id: 'created_price' }) }
      }));
    });

    const { updateProduct } = await import('../products');
    const req: any = { params: { id: 'old_id' }, body: { price: '12', name: 'New' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await updateProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(mockUpdateDb).toHaveBeenCalled();
  });

  test('updateProduct creates new price when price changed', async () => {
    jest.resetModules();
    const found = { id: 'p2', price: 10, priceId: 'price_old', image: '', name: 'P', description: '', stockQuantity: 5 };
    const mockFindFirst = jest.fn().mockResolvedValue(found);
    const mockUpdateDb = jest.fn().mockResolvedValue({ id: 'p2' });
    (global as any).prisma = { product: { findFirst: mockFindFirst, update: mockUpdateDb } };

    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({
        products: { update: jest.fn().mockResolvedValue(true) },
        prices: { create: jest.fn().mockResolvedValue({ id: 'price_new' }) }
      }));
    });

    const { updateProduct } = await import('../products');
    const req: any = { params: { id: 'p2' }, body: { price: '15' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await updateProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(mockUpdateDb).toHaveBeenCalled();
  });

  test('deleteProduct returns 404 when not found', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn().mockResolvedValue(null) } };
    const { deleteProduct } = await import('../products');
    const req: any = { params: { id: 'x' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await deleteProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Product not found' });
  });

  test('deleteProduct hides product and calls stripe update (caught)', async () => {
    jest.resetModules();
    const existing = { id: 'p3' };
    const mockFindUnique = jest.fn().mockResolvedValue(existing);
    const mockUpdate = jest.fn().mockResolvedValue({ id: 'p3', status: 'HIDDEN' });
    (global as any).prisma = { product: { findUnique: mockFindUnique, update: mockUpdate } };

    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ products: { update: jest.fn().mockRejectedValue(new Error('stripe fail')) } }));
    });

    const { deleteProduct } = await import('../products');
    const req: any = { params: { id: 'p3' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await deleteProduct(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('setProductStatus invalid status returns 400', async () => {
    jest.resetModules();
    (global as any).prisma = { product: { findUnique: jest.fn() } };
    const { setProductStatus } = await import('../products');
    const req: any = { params: { id: 'p4' }, body: { status: 'BAD' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await setProductStatus(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid status. Use ACTIVE or HIDDEN.' });
  });

  test('setProductStatus hides and calls stripe update when HIDDEN', async () => {
    jest.resetModules();
    const existing = { id: 'p5' };
    const mockFind = jest.fn().mockResolvedValue(existing);
    const mockUpdate = jest.fn().mockResolvedValue({ id: 'p5', status: 'HIDDEN' });
    (global as any).prisma = { product: { findUnique: mockFind, update: mockUpdate } };

    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => ({ products: { update: jest.fn().mockResolvedValue(true) } }));
    });

    const { setProductStatus } = await import('../products');
    const req: any = { params: { id: 'p5' }, body: { status: 'HIDDEN' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await setProductStatus(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('getInventoryStats returns counts and totals', async () => {
    jest.resetModules();
    (global as any).prisma = {
      product: {
        count: jest.fn()
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1),
        aggregate: jest.fn().mockResolvedValue({ _sum: { stockQuantity: 25 } })
      }
    };
    const { getInventoryStats } = await import('../products');
    const req: any = {};
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    await getInventoryStats(req, { status } as any, jest.fn());
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ productsCount: 10, totalStock: 25, outOfStockCount: 2, lowStockCount: 1 });
  });
});
