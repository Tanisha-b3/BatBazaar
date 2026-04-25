import express from 'express';

import { auth } from '../middleware/auth.js';
import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from '../controller/cartController.js';

const router = express.Router();

router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/', auth, updateCartItem);
router.delete('/:productId', auth, removeCartItem);
router.delete('/', auth, clearCart);

export default router;