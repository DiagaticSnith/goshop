import request from 'supertest';

// Mock auth middleware to provide a test user uid
jest.mock('../../middleware/authMiddleware', () => ({
    authMiddleware: async (req: any, res: any, next: any) => {
        req.uid = (global as any).__TEST_UID || 'cart-user-uid';
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

import prisma from '../../config/prisma-client';
import app from '../../index';

beforeAll(async () => {
    // ensure user and product exist
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.user.deleteMany({ where: { firebaseId: 'cart-user-uid' } }).catch(() => {});
    await prisma.user.create({ data: { firebaseId: 'cart-user-uid', email: 'cart@example.com', fullName: 'Cart User', role: 'USER' } as any });
    await prisma.product.create({ data: {
        id: 'cart-prod-1', name: 'Cart Product', description: 'For cart', price: 5.0, stockQuantity: 20, image: 'http://example.com/p.png', priceId: 'price-cart-1'
    }}).catch(() => {});
});
afterAll(async () => {
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.user.deleteMany({ where: { firebaseId: 'cart-user-uid' } }).catch(() => {});
    await prisma.product.deleteMany({ where: { id: 'cart-prod-1' } }).catch(() => {});
});

describe('CART - Cart integration tests', () => {
    // CART-001 add item to cart
    test('CART-001 add item to cart -> 201 and item created', async () => {
        const res = await request(app).post('/cart/items').send({ productId: 'cart-prod-1', quantity: 3 });
        expect([200,201]).toContain(res.status);
        expect(res.body).toHaveProperty('id');
        expect(res.body.totalQuantity === 3).toBeTruthy();
    });

    // CART-002 get cart
    test('CART-002 get cart -> 200 includes items', async () => {
        const res = await request(app).get('/cart');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('items');
        expect(Array.isArray(res.body.items)).toBeTruthy();
    });

    // CART-003 remove item
    test('CART-003 remove cart item -> 200 on delete', async () => {
        // find cart item
        const cart = await prisma.cart.findUnique({ where: { userId: 'cart-user-uid' }, include: { items: true } });
        expect(cart).toBeTruthy();
        const itemId = cart!.items[0].id;
        const res = await request(app).delete(`/cart/items/${itemId}`);
        expect(res.status).toBe(200);
    });

        // CART-004: delete product from cart and ensure DB record removed
        test('CART-004 delete product removes DB record', async () => {
            // add item again
            const addRes = await request(app).post('/cart/items').send({ productId: 'cart-prod-1', quantity: 1 });
            expect([200,201]).toContain(addRes.status);
            const cart = await prisma.cart.findUnique({ where: { userId: 'cart-user-uid' }, include: { items: true } });
            expect(cart).toBeTruthy();
            const itemId = cart!.items[0].id;
            const del = await request(app).delete(`/cart/items/${itemId}`);
            expect(del.status).toBe(200);
            const deleted = await prisma.cartItem.findUnique({ where: { id: itemId } });
            expect(deleted).toBeNull();
        });

        // CART-005: admin updates product price -> cart reflects new product price when fetched
        test('CART-005 admin price update updates cart product price', async () => {
            // add item to cart
            await request(app).post('/cart/items').send({ productId: 'cart-prod-1', quantity: 2 });
            // admin updates product price via prisma (simulate admin action)
            await prisma.product.update({ where: { id: 'cart-prod-1' }, data: { price: 9.99 } });
            // fetch cart and check product price in embedded product
            const res = await request(app).get('/cart');
            expect(res.status).toBe(200);
            const items = res.body.items || [];
            expect(items.length).toBeGreaterThanOrEqual(1);
            expect(items[0].product).toHaveProperty('price');
            expect(Number(items[0].product.price)).toBeCloseTo(9.99);
        });

        // CART-007: empty cart cannot checkout (simulate attempt)
        test('CART-007 empty cart cannot checkout -> blocked', async () => {
            // clear cart
            await request(app).post('/cart/clear');
            const cartRes = await request(app).get('/cart');
            expect(cartRes.status).toBe(200);
            expect(cartRes.body.items && cartRes.body.items.length).toBeLessThanOrEqual(0);

            // attempt to create checkout with empty lineItems
            const checkoutRes = await request(app).post('/checkout').send({ lineItems: [], email: 'cart@example.com' });
            // The controller may accept empty line items; expect it to reject - assert not 201
            expect(checkoutRes.status).not.toBe(201);
        });

        // CART-008: cart persists after closing browser (server-side persistence across sessions)
        test('CART-008 cart persists after logout/login -> items remain', async () => {
            // ensure item present
            await request(app).post('/cart/items').send({ productId: 'cart-prod-1', quantity: 1 });
            // simulate logout (no-op server-side)
            // simulate login as same user (authMiddleware uses fixed uid)
            const res = await request(app).get('/cart');
            expect(res.status).toBe(200);
            expect(res.body.items && res.body.items.length).toBeGreaterThanOrEqual(1);
        });
});
