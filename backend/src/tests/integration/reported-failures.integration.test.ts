import request from 'supertest';

// Use existing auth middleware mock pattern where tests set global __TEST_UID / __TEST_ROLE
jest.mock('../../middleware/authMiddleware', () => ({
    authMiddleware: async (req: any, res: any, next: any) => {
        req.uid = (global as any).__TEST_UID || 'test-uid';
        req.role = (global as any).__TEST_ROLE || 'USER';
        return next();
    }
}));

import prisma from '../../config/prisma-client';
import app from '../../index';

beforeAll(async () => {
    // Clean a few tables to keep tests isolated
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
});
afterAll(async () => {
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.orderDetails.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
});

describe('Reported failing integration cases (from test report)', () => {
    test('CART-006: Admin deletes product that is in user cart -> product disappears from cart', async () => {
        // Create admin and user and product
        await prisma.user.create({ data: { firebaseId: 'admin-cart', email: 'admin.cart@example.com', fullName: 'Admin Cart', role: 'ADMIN' } }).catch(() => {});
        await prisma.user.create({ data: { firebaseId: 'user-cart', email: 'user.cart@example.com', fullName: 'User Cart', role: 'USER' } }).catch(() => {});
        await prisma.product.create({ data: { id: 'prod-cart-1', name: 'ToBeDeleted', description: 'x', price: 1.0, stockQuantity: 5, image: '', priceId: 'price-pc1' } }).catch(() => {});

        // Create cart for user and add item
        const cart = await prisma.cart.create({ data: { userId: 'user-cart' } }).catch(() => null);
        if (cart) await prisma.cartItem.create({ data: { cartId: cart.id, productId: 'prod-cart-1', totalQuantity: 1 } }).catch(() => {});

        // Admin deletes product
        (global as any).__TEST_UID = 'admin-cart';
        (global as any).__TEST_ROLE = 'ADMIN';
        const delRes = await request(app).delete('/products/prod-cart-1');
        expect([200,204,201]).toContain(delRes.status);

        // Now as user fetch cart and expect product not present
        (global as any).__TEST_UID = 'user-cart';
        (global as any).__TEST_ROLE = 'USER';
        const cartRes = await request(app).get('/cart');
        expect(cartRes.status).toBe(200);
        const items = cartRes.body.items || cartRes.body || [];
        const found = (items || []).some((it: any) => (it.productId || it.product?.id) === 'prod-cart-1');
        expect(found).toBeFalsy();
    });

    test('ODM-005: Admin search orders by numeric id -> returns matching order', async () => {
        // create admin
        await prisma.user.create({ data: { firebaseId: 'admin-orders-2', email: 'admin.o2@example.com', fullName: 'Admin O2', role: 'ADMIN' } }).catch(() => {});
        (global as any).__TEST_UID = 'admin-orders-2';
        (global as any).__TEST_ROLE = 'ADMIN';

        // create an order and then search by its id string
        const ord = await prisma.order.create({ data: { amount: 12.0, userId: 'admin-orders-2', country: 'VN', address: 'addr', sessionId: `sess-${Date.now()}` } as any });
        const res = await request(app).get('/orders').query({ search: String(ord.id) });
        expect(res.status).toBe(200);
        expect(res.body.data.some((o: any) => o.id === ord.id)).toBeTruthy();
    });

    test('ACC-010: Reject update when phone number longer than 11 digits', async () => {
        // create user
        await prisma.user.create({ data: { firebaseId: 'user-phone-1', email: 'ph1@example.com', fullName: 'Ph1', role: 'USER' } }).catch(() => {});
        (global as any).__TEST_UID = 'user-phone-1';
        (global as any).__TEST_ROLE = 'USER';

        const res = await request(app).patch('/users/update/user-phone-1').send({ phone: '012345678911' });
        // Expected: should be rejected (400 or 422); the current implementation may accept — test will fail until fixed
        expect([400,422]).toContain(res.status);
    });

    test('ACC-011: Reject update when phone number shorter than 10 digits', async () => {
        await prisma.user.create({ data: { firebaseId: 'user-phone-2', email: 'ph2@example.com', fullName: 'Ph2', role: 'USER' } }).catch(() => {});
        (global as any).__TEST_UID = 'user-phone-2';
        (global as any).__TEST_ROLE = 'USER';

        const res = await request(app).patch('/users/update/user-phone-2').send({ phone: '01234567' });
        expect([400,422]).toContain(res.status);
    });

    test('CKT-004: Checkout should error if stock goes to 0 during checkout', async () => {
        // create product with zero stock after admin update
        await prisma.user.create({ data: { firebaseId: 'admin-ckt', email: 'admin.ckt@example.com', fullName: 'Admin Ckt', role: 'ADMIN' } }).catch(() => {});
        await prisma.user.create({ data: { firebaseId: 'buyer-ckt', email: 'buyer.ckt@example.com', fullName: 'Buyer Ckt', role: 'USER' } }).catch(() => {});
        await prisma.product.create({ data: { id: 'prod-ckt-1', name: 'CKTProd', description: '', price: 5.0, stockQuantity: 0, image: '', priceId: 'price-ckt-1' } }).catch(() => {});

        // Buyer attempts to checkout an out-of-stock product
        (global as any).__TEST_UID = 'buyer-ckt';
        (global as any).__TEST_ROLE = 'USER';
        const payload = { lineItems: [{ price: 'price-ckt-1', quantity: 1 }], email: 'b@ckt.com', userId: 'buyer-ckt', address: 'x' };
        const res = await request(app).post('/checkout').send(payload);
        // Expect conflict 409 or 400
        expect([409,400]).toContain(res.status);
    });

    test('AUT-004: Google first-login should create user and login (expected behavior)', async () => {
        // This project does not expose a dedicated Google OAuth callback endpoint in backend routes
        // Placeholder test: simulate behavior by checking that accessing a protected route with a new uid creates DB user
        (global as any).__TEST_UID = 'social-new-uid';
        (global as any).__TEST_ROLE = 'USER';

        // call a protected endpoint that triggers user creation on first seen uid (not implemented)
        const res = await request(app).get('/products');
        // Expected behavior (per spec): user created and logged in — here we assert user exists in DB
        const user = await prisma.user.findUnique({ where: { firebaseId: 'social-new-uid' } });
        expect(user).toBeTruthy();
    });

    test('AUT-006: After login user should be redirected to previous page (expected behavior)', async () => {
        // Simulate being redirected to login from /products/redirect-me
        (global as any).__TEST_UID = undefined;
        (global as any).__TEST_ROLE = undefined;
        // Attempt to access protected route (buy) should return 401 or redirect; we assert redirect is expected
        const res1 = await request(app).post('/checkout').send({ lineItems: [], email: 'x', userId: '' });
        expect([401,302]).toContain(res1.status);

        // Simulate completing login by setting uid then re-attempt original action
        (global as any).__TEST_UID = 'post-login-uid';
        (global as any).__TEST_ROLE = 'USER';
        const res2 = await request(app).post('/checkout').send({ lineItems: [], email: 'x', userId: 'post-login-uid' });
        // Expected: after login, action proceeds (201/200)
        expect([200,201]).toContain(res2.status);
    });
});

export {};
