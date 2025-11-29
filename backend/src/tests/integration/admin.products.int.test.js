const express = require('express');
const request = require('supertest');

jest.setTimeout(20000);

// Mock admin auth + role
jest.doMock('../../middleware/authMiddleware', () => ({ authMiddleware: (req, res, next) => { req.uid = 'admin-1'; next(); } }));
jest.doMock('../../middleware/verifyRolesMiddleware', () => ({ verifyRolesMiddleware: (roles) => (req, res, next) => next() }));

describe('Integration: Admin Product & Category Management (INT-ADM-01..05)', () => {
  afterEach(() => {
    jest.resetModules();
    delete global.prisma;
  });

  test('INT-ADM-01 Admin create category -> catalog shows new category on product create', async () => {
    jest.resetModules();
    jest.doMock('../../config/stripe', () => ({ products: { create: jest.fn().mockResolvedValue({ id: 's10', default_price: 'p10' }) } }));

    global.prisma = {
      product: {
        create: jest.fn().mockResolvedValue({ id: 's10', name: 'NewProd', price: 20, image: '', status: 'ACTIVE', category: { id: 11, name: 'NewCat' } }),
        findMany: jest.fn().mockResolvedValue([{ id: 's10', name: 'NewProd', price: 20, image: '', status: 'ACTIVE', category: { id: 11, name: 'NewCat' } }])
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const createRes = await request(app).post('/products').send({ name: 'NewProd', description: 'd', price: '20', stockQuantity: '5', category: 'NewCat' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.category).toBeDefined();
    expect(createRes.body.category.name).toBe('NewCat');

    const listRes = await request(app).get('/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].category.name).toBe('NewCat');
  });

  test('INT-ADM-02 Admin create product -> catalog shows it', async () => {
    jest.resetModules();
    jest.doMock('../../config/stripe', () => ({ products: { create: jest.fn().mockResolvedValue({ id: 's11', default_price: 'p11' }) } }));

    global.prisma = { product: { create: jest.fn().mockResolvedValue({ id: 's11', name: 'ProdAdmin', price: 30, image: '', status: 'ACTIVE', category: { id: 12, name: 'C12' } }), findMany: jest.fn().mockResolvedValue([{ id: 's11', name: 'ProdAdmin', price: 30, image: '', status: 'ACTIVE', category: { id: 12, name: 'C12' } }]) } };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const createRes = await request(app).post('/products').send({ name: 'ProdAdmin', description: 'd', price: '30', stockQuantity: '10', category: 'C12' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBe('s11');

    const listRes = await request(app).get('/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].name).toBe('ProdAdmin');
  });

  test('INT-ADM-03 Admin update product -> changes reflected', async () => {
    jest.resetModules();
    // mock found product and stripe operations
    const found = { id: 's12', name: 'OldName', price: 40, image: '', status: 'ACTIVE' };
    const updated = { id: 's12', name: 'NewName', price: 45, image: '', status: 'ACTIVE', category: { id: 13, name: 'C13' } };

    jest.doMock('../../config/stripe', () => ({ products: { update: jest.fn().mockResolvedValue({}), create: jest.fn().mockResolvedValue({ id: 's12', default_price: 'p12' }) }, prices: { create: jest.fn().mockResolvedValue({ id: 'price_new' }) } }));

    global.prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(found),
        update: jest.fn().mockResolvedValue(updated)
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).patch('/products/s12').send({ name: 'NewName', price: '45', stockQuantity: '8', category: 'C13' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('NewName');
    expect(res.body.price).toBe(45);
  });

  test('INT-ADM-04 Admin delete product -> product hidden', async () => {
    jest.resetModules();
    const existing = { id: 's13', name: 'ToDelete', status: 'ACTIVE' };
    const hidden = { ...existing, status: 'HIDDEN' };

    jest.doMock('../../config/stripe', () => ({ products: { update: jest.fn().mockResolvedValue({}) } }));

    global.prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(hidden)
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).delete('/products/s13');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HIDDEN');
  });

  test('INT-ADM-05 Admin set out-of-stock -> stockQuantity becomes 0', async () => {
    jest.resetModules();
    const found = { id: 's14', name: 'Stocky', price: 12, image: '', status: 'ACTIVE' };
    const updated = { ...found, stockQuantity: 0 };

    global.prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(found),
        update: jest.fn().mockResolvedValue(updated)
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const res = await request(app).patch('/products/s14').send({ stockQuantity: '0', price: '12', category: 'C' });
    expect(res.status).toBe(200);
    expect(res.body.stockQuantity).toBe(0);
  });

  test('INT-ADM-06 Upload product images: multipart image upload displays correctly on product detail', async () => {
    jest.resetModules();
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    // Mock Cloudinary v2 uploader
    jest.doMock('cloudinary', () => ({ v2: { uploader: { upload: jest.fn().mockResolvedValue({ secure_url: 'https://cdn.example/test-image.jpg' }) } } }));
    // Mock Stripe product creation
    jest.doMock('../../config/stripe', () => ({ products: { create: jest.fn().mockResolvedValue({ id: 'stripe-prod-image', default_price: 'price_img' }) } }));

    // Create a temporary dummy image file to attach
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `test-image-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, Buffer.from([0xff, 0xd8, 0xff, 0xd9])); // minimal JPEG markers

    global.prisma = {
      product: {
        create: jest.fn().mockResolvedValue({ id: 'img-prod', name: 'ImgProd', price: 50, image: 'https://cdn.example/test-image.jpg', status: 'ACTIVE', category: { id: 20, name: 'ImgCat' } }),
        findMany: jest.fn().mockResolvedValue([{ id: 'img-prod', name: 'ImgProd', price: 50, image: 'https://cdn.example/test-image.jpg', status: 'ACTIVE', category: { id: 20, name: 'ImgCat' } }])
      }
    };

    const productsRoutes = require('../../routes/products').default;
    const app = express(); app.use(express.json()); app.use('/products', productsRoutes);

    const resCreate = await request(app)
      .post('/products')
      .field('name', 'ImgProd')
      .field('description', 'with image')
      .field('price', '50')
      .field('stockQuantity', '3')
      .field('category', 'ImgCat')
      .attach('image', tmpFile);

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch (e) {}

    expect(resCreate.status).toBe(201);
    expect(resCreate.body).toHaveProperty('image');
    expect(resCreate.body.image).toBe('https://cdn.example/test-image.jpg');

    // Verify product appears in catalog with image URL
    const listRes = await request(app).get('/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].image).toBe('https://cdn.example/test-image.jpg');
  });
});
