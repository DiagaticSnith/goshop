import { jest } from '@jest/globals';

// Mock prisma client used by controllers
const mockPrisma: any = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  cart: { findUnique: jest.fn(), create: jest.fn() },
  cartItem: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() }
};

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import { addOrUpdateCartItem, getCart, removeCartItem, clearCart } from '../../controllers/cart';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('Cart controller (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('addOrUpdateCartItem returns 401 when no uid', async () => {
    const req: any = { body: { productId: 'p1', quantity: 1 } };
    const res = makeRes();
    await addOrUpdateCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('addOrUpdateCartItem creates new cart and cartItem when none exists', async () => {
    const req: any = { uid: 'u1', body: { productId: 'p1', quantity: 3 } };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u1' });
    mockPrisma.cart.findUnique.mockResolvedValueOnce(null);
    mockPrisma.cart.create.mockResolvedValueOnce({ id: 'cart-1', userId: 'u1' });
    mockPrisma.cartItem.create.mockResolvedValueOnce({ id: 'ci-1', totalQuantity: 3 });

    await addOrUpdateCartItem(req, res as any);
    expect(mockPrisma.cart.create).toHaveBeenCalled();
    expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ cartId: 'cart-1' }) }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('addOrUpdateCartItem updates existing cartItem', async () => {
    const req: any = { uid: 'u1', body: { productId: 'p1', quantity: 5 } };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u1' });
    mockPrisma.cart.findUnique.mockResolvedValueOnce({ id: 'cart-1', userId: 'u1' });
    mockPrisma.cartItem.findFirst.mockResolvedValueOnce({ id: 'ci-1', totalQuantity: 2 });
    mockPrisma.cartItem.update.mockResolvedValueOnce({ id: 'ci-1', totalQuantity: 5 });

    await addOrUpdateCartItem(req, res as any);
    expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({ where: { id: 'ci-1' }, data: { totalQuantity: 5 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getCart returns 401 when not authenticated', async () => {
    const req: any = {};
    const res = makeRes();
    await getCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('removeCartItem returns 404 when not found', async () => {
    const req: any = { uid: 'u1', params: { id: 'missing' } };
    const res = makeRes();
    mockPrisma.cartItem.findUnique.mockResolvedValueOnce(null);
    await removeCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('clearCart deletes items when cart exists', async () => {
    const req: any = { uid: 'u1' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u1' });
    mockPrisma.cart.findUnique.mockResolvedValueOnce({ id: 'cart-1' });
    mockPrisma.cartItem.deleteMany.mockResolvedValueOnce({ count: 2 });
    await clearCart(req, res as any);
    expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getCart returns 404 when user not found', async () => {
    const req: any = { uid: 'uX' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await getCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getCart returns 403 when user hidden', async () => {
    const req: any = { uid: 'uH' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'uH', status: 'HIDDEN' });
    await getCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('addOrUpdateCartItem returns 404 when user not found', async () => {
    const req: any = { uid: 'u2', body: { productId: 'p1', quantity: 1 } };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await addOrUpdateCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('addOrUpdateCartItem returns 403 when user hidden', async () => {
    const req: any = { uid: 'u2', body: { productId: 'p1', quantity: 1 } };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u2', status: 'HIDDEN' });
    await addOrUpdateCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('removeCartItem returns 400 for missing id param', async () => {
    const req: any = { uid: 'u1', params: {} };
    const res = makeRes();
    await removeCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('removeCartItem returns 404 when cart exists but cart property missing', async () => {
    const req: any = { uid: 'u1', params: { id: 'ci-1' } };
    const res = makeRes();
    mockPrisma.cartItem.findUnique.mockResolvedValueOnce({ id: 'ci-1', cart: null });
    await removeCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('removeCartItem returns 403 when cart belongs to different user', async () => {
    const req: any = { uid: 'u1', params: { id: 'ci-2' } };
    const res = makeRes();
    mockPrisma.cartItem.findUnique.mockResolvedValueOnce({ id: 'ci-2', cart: { userId: 'other' } });
    await removeCartItem(req, res as any);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('removeCartItem deletes when owner matches', async () => {
    const req: any = { uid: 'u1', params: { id: 'ci-3' } };
    const res = makeRes();
    mockPrisma.cartItem.findUnique.mockResolvedValueOnce({ id: 'ci-3', cart: { userId: 'u1' } });
    mockPrisma.cartItem.delete.mockResolvedValueOnce({});
    await removeCartItem(req, res as any);
    expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'ci-3' } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('clearCart returns 404 when user not found', async () => {
    const req: any = { uid: 'u9' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await clearCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('clearCart returns 403 when user hidden', async () => {
    const req: any = { uid: 'u9' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u9', status: 'HIDDEN' });
    await clearCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('clearCart returns 200 when cart already empty', async () => {
    const req: any = { uid: 'u9' };
    const res = makeRes();
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'u9' });
    mockPrisma.cart.findUnique.mockResolvedValueOnce(null);
    await clearCart(req, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

export {};
