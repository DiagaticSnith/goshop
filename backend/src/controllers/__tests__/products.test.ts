import { searchForProducts } from '../products';

describe('products controller', () => {
  afterEach(() => jest.resetModules());

  test('searchForProducts returns products when prisma returns results', async () => {
    // Mock prisma
    const mockProducts = [{ id: 'p1', name: 'Toy', description: 'Nice toy' }];
    // set a mocked global.prisma so the project's prisma-client returns it
    (global as any).prisma = { product: { findMany: jest.fn().mockResolvedValue(mockProducts) } };

    const { searchForProducts } = await import('../products');

    const req: any = { body: { searchQuery: 'Toy' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    await searchForProducts(req, { status } as any, jest.fn());

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(mockProducts);
  });
  afterAll(() => { delete (global as any).prisma; });
});
