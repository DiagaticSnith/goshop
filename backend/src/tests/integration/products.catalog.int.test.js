const express = require('express');
const request = require('supertest');

// integration timeout
jest.setTimeout(20000);

// Mock auth + roles for admin endpoints across these integration tests
jest.doMock('../../middleware/authMiddleware', () => ({ authMiddleware: (req, res, next) => { req.uid = 'admin-1'; next(); } }));
jest.doMock('../../middleware/verifyRolesMiddleware', () => ({ verifyRolesMiddleware: (roles) => (req, res, next) => next() }));

describe('Integration: Product Catalog & Search', () => {
  afterEach(() => {
    jest.resetModules();
    delete global.prisma;
  });

  test('INT-CAT-01 Admin create product -> catalog shows it', async () => {
    jest.resetModules();
    // stripe mock for create
    jest.doMock('../../config/stripe', () => ({ products: { create: jest.fn().mockResolvedValue({ id: 's1', default_price: 'p1' }) } }));

    // prisma: create returns product, findMany returns product list
    global.prisma = {
      product: {
        create: jest.fn().mockResolvedValue({ id: 's1', name: 'Prod X', price: 10, image: '', status: 'ACTIVE', category: { id: 1, name: 'Cat' } }),
        findMany: jest.fn().mockResolvedValue([{ id: 's1', name: 'Prod X', price: 10, image: '', status: 'ACTIVE', category: { id: 1, name: 'Cat' } }])
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    // create product (admin)
    const createRes = await request(app).post('/products').send({ name: 'Prod X', description: 'd', price: '10', stockQuantity: '5', category: 'Cat' });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id', 's1');

    // catalog (public)
    const listRes = await request(app).get('/products');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body[0].name).toBe('Prod X');
  });

  test('INT-CAT-02 Search returns matching products', async () => {
    jest.resetModules();
    global.prisma = { product: { findMany: jest.fn().mockResolvedValue([{ id: 's2', name: 'SearchMe', price: 5, image: '', status: 'ACTIVE', category: { id: 2, name: 'C2' } }]) } };
    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).post('/products/search').send({ searchQuery: 'Search' });
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('SearchMe');
  });

  test('INT-CAT-03 Filter category returns correct products', async () => {
    jest.resetModules();
    global.prisma = { product: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', name: 'CatProd', price: 7, image: '', status: 'ACTIVE', category: { id: 3, name: 'C3' } }]) } };
    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).get('/products/category/3');
    expect(res.status).toBe(200);
    expect(res.body[0].category.id).toBe(3);
  });

  test('INT-CAT-04 Product detail returns product info', async () => {
    jest.resetModules();
    global.prisma = { product: { findFirst: jest.fn().mockResolvedValue({ id: 'pd1', name: 'DetailProd', price: 15, image: '', status: 'ACTIVE', category: { id: 4, name: 'C4' } }) } };
    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).get('/products/pd1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pd1');
    expect(res.body.name).toBe('DetailProd');
  });
});
