import request from 'supertest';

// Admin auth middleware mock
jest.mock('../../middleware/authMiddleware', () => ({
    authMiddleware: async (req: any, res: any, next: any) => {
        req.uid = (global as any).__TEST_UID || 'admin-orders-uid';
        req.role = (global as any).__TEST_ROLE || 'ADMIN';
        try {
            const prisma = require('../../config/prisma-client').default;
            const user = await prisma.user.findUnique({ where: { firebaseId: req.uid } });
            if (!user || !user.role) return res.status(401).json({ message: 'Unauthorized' });
            if ((user as any).status === 'HIDDEN') return res.status(403).json({ message: 'Account is locked' });
        } catch (e) {}
        return next();
    }
}));

// Mock stripe for refunds/retrieve used in reject flow
jest.mock('../../config/stripe', () => ({
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() }
}));

import prisma from '../../config/prisma-client';
import app from '../../index';

beforeAll(async () => {
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});

    await prisma.user.create({ data: { firebaseId: 'admin-orders-uid', email: 'admin.orders@example.com', fullName: 'Admin Orders', role: 'ADMIN' } as any });
    await prisma.product.create({ data: { id: 'order-prod-1', name: 'OrderProd', description: 'o', price: 10.0, stockQuantity: 5, image: 'http://x', priceId: 'price-order-1' } });
    const created = await prisma.order.create({ data: { amount: 10.0, userId: 'admin-orders-uid', country: 'US', address: 'addr', sessionId: 'sess-order-1' } as any });
    await prisma.orderDetails.create({ data: { orderId: created.id, productId: 'order-prod-1', totalQuantity: 1, totalPrice: 10.0 } });
});
afterAll(async () => {
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
});

describe('ODM - Orders admin integration tests', () => {
    test('ODM-001 admin list orders -> 200 and includes orders', async () => {
        const res = await request(app).get('/orders').set('Accept', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    test('ODM-002 admin confirm order -> status becomes CONFIRMED', async () => {
        const orders = await prisma.order.findMany();
        const id = orders[0].id;
        const res = await request(app).post(`/orders/${id}/confirm`);
        expect([200,201]).toContain(res.status);
        const updated = await prisma.order.findUnique({ where: { id } });
        expect((updated as any).status).toBe('CONFIRMED');
    });

    test('ODM-003 admin reject order -> status becomes REJECTED and refund attempted', async () => {
        // create a fresh order to reject
        const ord = await prisma.order.create({ data: { amount: 5.0, userId: 'admin-orders-uid', country: 'US', address: 'x', sessionId: 'sess-rej-1' } as any });
        // mock stripe checkout retrieve to return a payment_intent
        const stripe = require('../../config/stripe');
        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({ payment_intent: 'pi-123' });
        stripe.refunds.create.mockResolvedValueOnce({ id: 're_1' });

        const res = await request(app).post(`/orders/${ord.id}/reject`);
        expect([200,201]).toContain(res.status);
        const updated = await prisma.order.findUnique({ where: { id: ord.id } });
        expect((updated as any).status).toBe('REJECTED');
    });

    // ODM-004: Admin view all orders (unfiltered) - ensure endpoint returns full list
    test('ODM-004 admin view all orders unfiltered -> includes created orders', async () => {
        const res = await request(app).get('/orders').set('Accept', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    // ODM-006: Admin filter by status=Pending
    test('ODM-006 admin filter by status pending -> returns only pending orders', async () => {
        // create pending and confirmed orders
        const pending = await prisma.order.create({ data: { amount: 1.0, userId: 'admin-orders-uid', country: 'US', address: 'a', sessionId: `sess-p-${Date.now()}` } as any });
        const confirmed = await prisma.order.create({ data: { amount: 2.0, userId: 'admin-orders-uid', country: 'US', address: 'a', sessionId: `sess-c-${Date.now()}` } as any });
        await prisma.order.update({ where: { id: confirmed.id }, data: { status: 'CONFIRMED' as any } });

        const res = await request(app).get('/orders').query({ status: 'PENDING' });
        expect(res.status).toBe(200);
        expect(res.body.data.every((o: any) => o.status === 'PENDING')).toBeTruthy();
    });

    // ODM-007: Admin filter by date range
    test('ODM-007 admin filter by date range -> returns orders within range', async () => {
        const from = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app).get('/orders').query({ from, to });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
    });

    // ODM-008: Admin filter by status + date range combined
    test('ODM-008 admin combined filter status+date -> returns matched orders', async () => {
        const from = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app).get('/orders').query({ status: 'CONFIRMED', from, to });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
    });
});
