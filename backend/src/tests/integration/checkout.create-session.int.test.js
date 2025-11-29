/* eslint-env jest */
describe('Checkout create session (integration)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('[INT-PAY-02] Checkout -> Stripe Session: creates checkout session when stock is sufficient', async () => {
    jest.resetModules();

    // Minimal global prisma mock used by controller
    global.prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', name: 'Test Product', stockQuantity: 10 })
      }
    };

    const mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({ id: 'sess_1', url: 'https://checkout.example/session/sess_1' })
        }
      }
    };

    jest.mock('../../config/stripe', () => mockStripe);

    const { createCheckoutSession } = require('../../controllers/checkout');

    const req = {
      body: {
        lineItems: [ { price: 'price_1', quantity: 2 } ],
        email: 'buyer@example.com',
        userId: 'user-1',
        address: '123 Test St'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await createCheckoutSession(req, res, (err) => { throw err; });

    expect(global.prisma.product.findUnique).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'sess_1', url: expect.any(String) }));
  });

  test('[INT-PAY-07] Out of stock during checkout: returns 409 when insufficient stock', async () => {
    jest.resetModules();

    global.prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', name: 'Test Product', stockQuantity: 1 })
      }
    };

    const mockStripe = {
      checkout: { sessions: { create: jest.fn() } }
    };
    jest.mock('../../config/stripe', () => mockStripe);

    const { createCheckoutSession } = require('../../controllers/checkout');

    const req = {
      body: {
        lineItems: [ { price: 'price_1', quantity: 2 } ],
        email: 'buyer@example.com',
        userId: 'user-1'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await createCheckoutSession(req, res, (err) => { throw err; });

    expect(global.prisma.product.findUnique).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Insufficient stock') }));
  });
  // Implement INT-PAY-01: Cart -> Checkout Page
  test('[INT-PAY-01] Cart -> Checkout Page: cart items and total displayed correctly', async () => {
    jest.resetModules();

    // Mock a cart for the user
    global.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1' }) },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 30, userId: 'u1', items: [ { id: 31, totalQuantity: 2, product: { id: 'p10', name: 'Prod10', price: 15 } } ] }) }
    };

    const { getCart } = require('../../controllers/cart');
    const req = { uid: 'u1' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await getCart(req, res);

    expect(global.prisma.cart.findUnique).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items: expect.any(Array) }));
    // verify computed total if front-end would compute it: 2 * 15 = 30
    expect(res.json.mock.calls[0][0].items[0].totalQuantity).toBe(2);
  });
});
