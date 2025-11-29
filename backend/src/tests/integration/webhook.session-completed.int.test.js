/* eslint-env jest */
describe('Webhook / Stripe checkout.session.completed (integration)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('[INT-PAY-03] Stripe Success -> Webhook -> Order DB: creates order on checkout.session.completed and is visible via orders APIs', async () => {
    jest.resetModules();

    // Prepare global prisma mocks used inside webhook controller and orders controllers
    const createdOrder = { id: 999, amount: 200, userId: 'user-1', details: [], user: { id: 'user-1' } };
    global.prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod-1', price: 100, stockQuantity: 5 }) },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        const tx = {
          order: { create: jest.fn().mockResolvedValue({ id: createdOrder.id }) },
          product: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({ stockQuantity: 3 }),
            update: jest.fn().mockResolvedValue({})
          },
          orderDetails: { create: jest.fn().mockResolvedValue({}) }
        };
        return cb(tx);
      }),
      order: {
        findUnique: jest.fn().mockResolvedValue(createdOrder),
        findMany: jest.fn().mockResolvedValue([createdOrder])
      },
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 'cart-1', items: [] }) },
      cartItem: { deleteMany: jest.fn().mockResolvedValue({}) }
    };

    const mockStripe = { webhooks: { constructEvent: jest.fn() }, checkout: { sessions: { listLineItems: jest.fn() } } };
    jest.mock('../../config/stripe', () => mockStripe);

    const { webhook } = require('../../controllers/webhook');
    const { getOrderById, getOrdersByUserId } = require('../../controllers/orders');

    // Simulate Stripe event
    mockStripe.webhooks.constructEvent.mockReturnValue({ type: 'checkout.session.completed', data: { object: { id: 'sess_1', amount_total: 20000, created: Math.floor(Date.now() / 1000), metadata: { customerId: 'user-1' } } } });
    mockStripe.checkout.sessions.listLineItems.mockResolvedValue({ data: [ { price: { id: 'price_1' }, quantity: 2 } ] });

    const req = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('raw') };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };

    await webhook(req, res);

    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(mockStripe.checkout.sessions.listLineItems).toHaveBeenCalledWith('sess_1');
    expect(global.prisma.$transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Order created', order: expect.any(Object) }));

    // INT-PAY-06: After Stripe success, /success (order detail) should show the created order
    const reqGet = { params: { id: String(createdOrder.id) }, uid: 'user-1' };
    const resGet = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await getOrderById(reqGet, resGet);
    expect(global.prisma.order.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: createdOrder.id } }));
    expect(resGet.status).toHaveBeenCalledWith(200);
    expect(resGet.json).toHaveBeenCalledWith(createdOrder);

    // INT-PAY-10: Order should appear in user's orders list
    const reqList = { params: { id: 'user-1' } };
    const resList = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await getOrdersByUserId(reqList, resList);
    expect(global.prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
    expect(resList.status).toHaveBeenCalledWith(200);
    expect(resList.json).toHaveBeenCalledWith([createdOrder]);
  });

  test('[INT-PAY-05] Webhook signature wrong: returns 400 when signature invalid', async () => {
    jest.resetModules();

    const mockStripe = { webhooks: { constructEvent: jest.fn() } };
    jest.mock('../../config/stripe', () => mockStripe);

    const { webhook } = require('../../controllers/webhook');

    mockStripe.webhooks.constructEvent.mockImplementation(() => { throw new Error('invalid signature'); });

    const req = { headers: { 'stripe-signature': 'bad' }, body: Buffer.from('raw') };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };

    await webhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Webhook Error'));
  });

  test('returns 200 for unrelated events (no order created)', async () => {
    jest.resetModules();

    const mockStripe = { webhooks: { constructEvent: jest.fn() } };
    jest.mock('../../config/stripe', () => mockStripe);

    const { webhook } = require('../../controllers/webhook');

    mockStripe.webhooks.constructEvent.mockReturnValue({ type: 'payment_intent.succeeded', data: { object: {} } });

    const req = { headers: { 'stripe-signature': 'sig' }, body: Buffer.from('raw') };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };

    await webhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Event received', order: undefined }));
  });
});
