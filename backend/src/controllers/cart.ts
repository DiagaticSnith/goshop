import { Request, Response } from 'express';
import prisma from '../config/prisma-client';
const p: any = prisma as any;

// Get current user's cart (create if not exists)
export const getCart = async (req: Request, res: Response) => {
  try {
    const uid = req.uid as string;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    // find user
    const user = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let cart = await p.cart.findUnique({ where: { userId: user.firebaseId }, include: { items: { include: { product: true } } } });
    if (!cart) {
      cart = await p.cart.create({ data: { userId: user.firebaseId } , include: { items: { include: { product: true } } } });
    }
    return res.status(200).json(cart);
  } catch (error) {
    console.error('getCart error', error);
    return res.status(500).json({ message: 'Unable to get cart', error });
  }
};

// Add or update cart item (body: productId, quantity)
export const addOrUpdateCartItem = async (req: Request, res: Response) => {
  try {
    const uid = req.uid as string;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'productId and quantity required' });

    console.log('[cart] addOrUpdateCartItem called', { uid, productId, quantity });

    const user = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let cart = await p.cart.findUnique({ where: { userId: user.firebaseId } });
    if (!cart) {
      cart = await p.cart.create({ data: { userId: user.firebaseId } });
      console.log('[cart] created cart for user', { userId: user.firebaseId, cartId: cart.id });
    }

    // find existing cartItem for product
    const existing = await p.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (existing) {
      const updated = await p.cartItem.update({ where: { id: existing.id }, data: { totalQuantity: quantity } });
      console.log('[cart] updated cartItem', { updated });
      return res.status(200).json(updated);
    } else {
      const created = await p.cartItem.create({ data: { cartId: cart.id, productId, totalQuantity: quantity } });
      console.log('[cart] created cartItem', { created });
      return res.status(201).json(created);
    }
  } catch (error) {
    console.error('addOrUpdateCartItem error', error);
    return res.status(500).json({ message: 'Unable to add/update cart item', error });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const uid = req.uid as string;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });

    // ensure cart belongs to user
  const cartItem = await p.cartItem.findUnique({ where: { id }, include: { cart: true } });
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });
    if (!cartItem.cart) return res.status(404).json({ message: 'Cart not found' });
    if (cartItem.cart.userId !== uid) return res.status(403).json({ message: 'Forbidden' });

  await p.cartItem.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    console.error('removeCartItem error', error);
    return res.status(500).json({ message: 'Unable to remove cart item', error });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const uid = req.uid as string;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });
  const cart = await p.cart.findUnique({ where: { userId: user.firebaseId } });
    if (!cart) return res.status(200).json({ message: 'Cart already empty' });
  await p.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('clearCart error', error);
    return res.status(500).json({ message: 'Unable to clear cart', error });
  }
};
