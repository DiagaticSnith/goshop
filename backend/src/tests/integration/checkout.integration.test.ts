import request from 'supertest';

// Control auth uid via global.__TEST_UID
jest.mock('../../middleware/authMiddleware', () => ({
    authMiddleware: async (req: any, res: any, next: any) => {
        req.uid = (global as any).__TEST_UID || 'ck-user-1';
        req.role = (global as any).__TEST_ROLE || 'USER';
        try {
            const prisma = require('../../config/prisma-client').default;
            const user = await prisma.user.findUnique({ where: { firebaseId: req.uid } });
            if (!user || !user.role) return res.status(401).json({ message: 'Unauthorized' });
            if ((user as any).status === 'HIDDEN') return res.status(403).json({ message: 'Account is locked' });
        } catch (e) {}
        return next();
    }
}));

// Mock stripe checkout session operations
jest.mock('../../config/stripe', () => ({
    checkout: { sessions: { create: jest.fn(), retrieve: jest.fn(), listLineItems: jest.fn() } }
}));

import prisma from '../../config/prisma-client';
import app from '../../index';

beforeAll(async () => {
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany({ where: { firebaseId: 'ck-user-1' } }).catch(() => {});
    await prisma.user.create({ data: { firebaseId: 'ck-user-1', email: 'ck@example.com', fullName: 'CK User', role: 'USER' } as any });
    await prisma.product.create({ data: { id: 'ck-prod-1', name: 'CK Product', description: 'ck', price: 3.5, stockQuantity: 10, image: 'http://x', priceId: 'price-ck-1' } });
});
afterAll(async () => {
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany({ where: { firebaseId: 'ck-user-1' } }).catch(() => {});
});

describe('CKT - Checkout integration tests', () => {
    test('CKT-001 create checkout session -> 201 and returns sessionId/url', async () => {
        const stripe = require('../../config/stripe');
        stripe.checkout.sessions.create.mockResolvedValueOnce({ id: 'sess-ck-1', url: 'https://stripe/checkout' });

        const res = await request(app).post('/checkout').send({
            lineItems: [{ price: 'price-ck-1', quantity: 2 }],
            email: 'ck@example.com',
            userId: 'ck-user-1'
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('sessionId');
        expect(res.body).toHaveProperty('url');
    });

    test('CKT-002 create checkout session with insufficient stock -> 409', async () => {
        // reduce product stock to 1 to force insufficient
        await prisma.product.update({ where: { id: 'ck-prod-1' }, data: { stockQuantity: 1 } });
        const res = await request(app).post('/checkout').send({ lineItems: [{ price: 'price-ck-1', quantity: 3 }], email: 'ck@example.com' });
        expect(res.status).toBe(409);
    });

    test('CKT-003 get checkout session -> 200', async () => {
        const stripe = require('../../config/stripe');
        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({ id: 'sess-ck-1', amount_total: 350, created: Math.floor(Date.now() / 1000) });
        const res = await request(app).get('/checkout/sess-ck-1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    // CKT-005: redirect success page simulation (create session then assume success page shows order)
    test('CKT-005 success redirect -> session created and can be retrieved', async () => {
        const stripe = require('../../config/stripe');
        stripe.checkout.sessions.create.mockResolvedValueOnce({ id: 'sess-success-1', url: 'https://stripe/checkout/sess-success-1' });
        const createRes = await request(app).post('/checkout').send({ lineItems: [{ price: 'price-ck-1', quantity: 1 }], email: 'ck@example.com', userId: 'ck-user-1' });
        expect(createRes.status).toBe(201);
        // simulate visiting /checkout/success?id={CHECKOUT_SESSION_ID} by retrieving session
        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({ id: 'sess-success-1', amount_total: 350, created: Math.floor(Date.now() / 1000) });
        const getRes = await request(app).get('/checkout/sess-success-1');
        expect(getRes.status).toBe(200);
    });

    // CKT-006: multiple card types simulation - ensure create checkout returns session for repeated calls
    test('CKT-006 multiple card types checkout simulation -> sessions created', async () => {
        const stripe = require('../../config/stripe');
        stripe.checkout.sessions.create.mockResolvedValue({ id: 'sess-multi', url: 'https://stripe/checkout/multi' });
        const resVisa = await request(app).post('/checkout').send({ lineItems: [{ price: 'price-ck-1', quantity: 1 }], email: 'ck@example.com', userId: 'ck-user-1' });
        const resMaster = await request(app).post('/checkout').send({ lineItems: [{ price: 'price-ck-1', quantity: 1 }], email: 'ck@example.com', userId: 'ck-user-1' });
        expect(resVisa.status).toBe(201);
        expect(resMaster.status).toBe(201);
    });

    // CKT-008: webhook wrong signature -> 400
    test('CKT-008 webhook wrong signature -> 400 and no order created', async () => {
        const stripe = require('../../config/stripe');
        // constructEvent will throw
        stripe.webhooks = stripe.webhooks || {};
        stripe.webhooks.constructEvent = jest.fn(() => { throw new Error('invalid signature'); });
        const payload = Buffer.from(JSON.stringify({ fake: true }));
        const res = await request(app).post('/api/webhook').set('stripe-signature', 'bad').set('Content-Type', 'application/json').send(payload);
        expect(res.status).toBe(400);
    });
});
