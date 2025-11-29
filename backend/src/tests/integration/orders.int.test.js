/* eslint-env jest */
describe('Order Management integration tests (INT-ORD-01..06)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('INT-ORD-01 Admin confirm order updates DB', async () => {
    jest.resetModules();
    // initial order is PENDING
    const orderRecord = { id: 1, status: 'PENDING', userId: 'user-1' };

    global.prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(orderRecord),
        update: jest.fn().mockResolvedValue({ ...orderRecord, status: 'CONFIRMED' })
      }
    };

    const { confirmOrder } = require('../../controllers/orders');

    const req = { params: { id: '1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await confirmOrder(req, res);

    expect(global.prisma.order.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(global.prisma.order.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'CONFIRMED' } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'CONFIRMED' }));
  });

  test('INT-ORD-02 Admin update status then user sees updated order', async () => {
    jest.resetModules();
    const updatedOrder = { id: 2, status: 'SHIPPED', userId: 'user-2' };

    global.prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValueOnce({ id: 2, status: 'PENDING', userId: 'user-2' })
                                .mockResolvedValueOnce(updatedOrder),
        update: jest.fn().mockResolvedValue(updatedOrder)
      }
    };

    const { confirmOrder, getOrderById } = require('../../controllers/orders');

    // Admin confirms
    const adminReq = { params: { id: '2' } };
    const adminRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await confirmOrder(adminReq, adminRes);
    expect(global.prisma.order.update).toHaveBeenCalled();

    // User fetches their order (role not admin, but uid matches)
    const userReq = { params: { id: '2' }, uid: 'user-2' };
    const userRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    await getOrderById(userReq, userRes);

    expect(global.prisma.order.findUnique).toHaveBeenCalled();
    expect(userRes.status).toHaveBeenCalledWith(200);
    expect(userRes.json).toHaveBeenCalledWith(updatedOrder);
  });

  test('INT-ORD-03 User view My Orders returns list', async () => {
    jest.resetModules();
    const userOrders = [{ id: 3, userId: 'u3' }, { id: 4, userId: 'u3' }];

    global.prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(userOrders)
      }
    };

    const { getOrdersByUserId } = require('../../controllers/orders');
    const req = { params: { id: 'u3' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await getOrdersByUserId(req, res);

    expect(global.prisma.order.findMany).toHaveBeenCalledWith({ where: { userId: 'u3' }, orderBy: { createdAt: 'desc' }, include: { user: true, details: { include: { product: { include: { category: true } } } } } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userOrders);
  });

  test('INT-ORD-05 Admin view all orders returns data and total', async () => {
    jest.resetModules();
    const orders = [{ id: 5 }, { id: 6 }];

    global.prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(orders),
        count: jest.fn().mockResolvedValue(2)
      }
    };

    const { getAllOrders } = require('../../controllers/orders');
    const req = { query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await getAllOrders(req, res);

    expect(global.prisma.order.findMany).toHaveBeenCalled();
    expect(global.prisma.order.count).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: orders, total: 2 }));
  });

  test('INT-ORD-06 Filter orders by status (admin)', async () => {
    jest.resetModules();
    const confirmedOrders = [{ id: 7, status: 'CONFIRMED' }];

    global.prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(confirmedOrders),
        count: jest.fn().mockResolvedValue(1)
      }
    };

    const { getAllOrders } = require('../../controllers/orders');
    const req = { query: { status: 'CONFIRMED' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await getAllOrders(req, res);

    expect(global.prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'CONFIRMED' }) }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: confirmedOrders, total: 1 }));
  });
});
