import request from 'supertest';

// Webhook uses raw body + stripe.webhooks.constructEvent and checkout.listLineItems
jest.mock('../../config/stripe', () => ({
    webhooks: { constructEvent: jest.fn() },
    checkout: { sessions: { listLineItems: jest.fn() } }
}));

import prisma from '../../config/prisma-client';
import app from '../../index';

beforeAll(async () => {
    await prisma.product.deleteMany().catch(() => {});
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
    // seed product matching priceId used in webhook
    await prisma.product.create({ data: { id: 'wh-prod-1', name: 'WH Product', description: 'w', price: 4.0, stockQuantity: 5, image: 'http://x', priceId: 'price-wh-1' } });
});
afterAll(async () => {
    await prisma.product.deleteMany().catch(() => {});
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
});

describe('CKT/Webhook - Stripe webhook integration', () => {
    test('CKT-004 webhook checkout.session.completed creates order and decrements stock', async () => {
        const stripe = require('../../config/stripe');
        // constructEvent returns a checkout.session.completed event
        const sessionObj = { id: 'wh-sess-1', amount_total: 400, created: Math.floor(Date.now() / 1000), metadata: { customerId: 'webhook-user-1', address: 'Some Address' }, customer_details: { address: { country: 'US' } } };
        stripe.webhooks.constructEvent.mockImplementationOnce(() => ({ type: 'checkout.session.completed', data: { object: sessionObj } }));
        stripe.checkout.sessions.listLineItems.mockResolvedValueOnce({ data: [{ price: { id: 'price-wh-1' }, quantity: 2 }] });

        // ensure user exists for cart clearing (optional)
        await prisma.user.create({ data: { firebaseId: 'webhook-user-1', email: 'wh@example.com', fullName: 'WH User', role: 'USER' } as any }).catch(() => {});

        const payload = Buffer.from(JSON.stringify({ type: 'checkout.session.completed' }));
        const res = await request(app).post('/api/webhook').set('stripe-signature', 'sig-1').set('Content-Type', 'application/json').send(payload);
        expect([200,201]).toContain(res.status);

        // verify order created
        const orders = await prisma.order.findMany({ where: { sessionId: 'wh-sess-1' } });
        expect(orders.length).toBeGreaterThanOrEqual(1);

        // verify stock decremented
        const prod = await prisma.product.findUnique({ where: { id: 'wh-prod-1' } });
        expect((prod as any).stockQuantity).toBeLessThanOrEqual(5 - 2);
    });
});
