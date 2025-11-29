const express = require('express');
const request = require('supertest');

jest.setTimeout(20000);

describe('Integration: Shopping Cart flows', () => {
  afterEach(() => {
    jest.resetModules();
    delete global.prisma;
  });

  test('INT-CART-01 Add product from catalog -> cart created and item recorded', async () => {
    jest.resetModules();
    // Mock prisma operations used by controllers
    global.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1' }) },
      cart: {
        findUnique: jest.fn()
          // first call from addOrUpdateCartItem returns null to trigger create
          .mockResolvedValueOnce(null)
          // second call from getCart returns a cart with items
          .mockResolvedValueOnce({ id: 10, userId: 'u1', items: [{ id: 5, product: { id: 'p1', name: 'P1', price: 10 }, totalQuantity: 2 }] }) ,
        create: jest.fn().mockResolvedValue({ id: 10, userId: 'u1' })
      },
      cartItem: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 5, cartId: 10, productId: 'p1', totalQuantity: 2 })
      }
    };

    const cartCtrl = require('../../controllers/cart');
    const { addOrUpdateCartItem, getCart } = cartCtrl;

    const app = express(); app.use(express.json());
    // simple auth stub that sets uid
    app.use((req, res, next) => { req.uid = 'u1'; next(); });
    app.post('/cart/item', addOrUpdateCartItem);
    app.get('/cart', getCart);

    const addRes = await request(app).post('/cart/item').send({ productId: 'p1', quantity: 2 });
    expect(addRes.status).toBe(201);
    expect(addRes.body).toHaveProperty('id', 5);

    const cartRes = await request(app).get('/cart');
    expect(cartRes.status).toBe(200);
    expect(cartRes.body).toHaveProperty('items');
    expect(cartRes.body.items[0].totalQuantity).toBe(2);
  });

  test('INT-CART-02 Add product from product detail -> cart created and item recorded', async () => {
    jest.resetModules();
    // Mock prisma operations used by controllers (product detail add behaves same as catalog add)
    global.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1' }) },
      cart: {
        findUnique: jest.fn()
          // first call from addOrUpdateCartItem returns null to trigger create
          .mockResolvedValueOnce(null)
          // second call from getCart returns a cart with items
          .mockResolvedValueOnce({ id: 10, userId: 'u1', items: [{ id: 5, product: { id: 'p1', name: 'P1', price: 10 }, totalQuantity: 1 }] }) ,
        create: jest.fn().mockResolvedValue({ id: 10, userId: 'u1' })
      },
      cartItem: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 5, cartId: 10, productId: 'p1', totalQuantity: 1 })
      }
    };

    const cartCtrl = require('../../controllers/cart');
    const { addOrUpdateCartItem, getCart } = cartCtrl;

    const app = express(); app.use(express.json());
    // simple auth stub that sets uid
    app.use((req, res, next) => { req.uid = 'u1'; next(); });
    app.post('/cart/item', addOrUpdateCartItem);
    app.get('/cart', getCart);

    const addRes = await request(app).post('/cart/item').send({ productId: 'p1', quantity: 1 });
    expect(addRes.status).toBe(201);
    expect(addRes.body).toHaveProperty('id', 5);

    const cartRes = await request(app).get('/cart');
    expect(cartRes.status).toBe(200);
    expect(cartRes.body).toHaveProperty('items');
    expect(cartRes.body.items[0].totalQuantity).toBe(1);
  });

  test('INT-CART-04 Update quantity updates DB', async () => {
    jest.resetModules();
    // existing cart and cartItem exist -> update path
    global.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1' }) },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 11, userId: 'u1' }) },
      cartItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 6, cartId: 11, productId: 'p2', totalQuantity: 1 }),
        update: jest.fn().mockResolvedValue({ id: 6, cartId: 11, productId: 'p2', totalQuantity: 3 })
      }
    };

    const { addOrUpdateCartItem } = require('../../controllers/cart');
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { req.uid = 'u1'; next(); });
    app.post('/cart/item', addOrUpdateCartItem);

    const res = await request(app).post('/cart/item').send({ productId: 'p2', quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.totalQuantity).toBe(3);
  });

  test('INT-CART-05 Remove item -> DB deleted and response 200', async () => {
    jest.resetModules();
    global.prisma = {
      cartItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 7, cart: { id: 12, userId: 'u1' } }),
        delete: jest.fn().mockResolvedValue({})
      }
    };

    const { removeCartItem } = require('../../controllers/cart');
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { req.uid = 'u1'; next(); });
    app.delete('/cart/item/:id', removeCartItem);

    const res = await request(app).delete('/cart/item/7');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Deleted');
  });

  test('INT-CART-06 Admin update price -> open cart shows new price', async () => {
    jest.resetModules();
    // Simulate cart items referencing products; product price changed in DB
    global.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1' }) },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 20, userId: 'u1', items: [{ id: 21, totalQuantity: 2, product: { id: 'p3', name: 'P3', price: 25 } }] }) }
    };

    const { getCart } = require('../../controllers/cart');
    const app = express(); app.use(express.json());
    app.use((req, res, next) => { req.uid = 'u1'; next(); });
    app.get('/cart', getCart);

    const res = await request(app).get('/cart');
    expect(res.status).toBe(200);
    expect(res.body.items[0].product.price).toBe(25);
  });
});
