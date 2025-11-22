import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getCart, addOrUpdateCartItem, removeCartItem, clearCart } from '../controllers/cart';

const router = Router();
router.get('/', authMiddleware, getCart);
router.post('/items', authMiddleware, addOrUpdateCartItem);
router.delete('/items/:id', authMiddleware, removeCartItem);
router.post('/clear', authMiddleware, clearCart);

export default router;
