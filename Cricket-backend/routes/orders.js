import express from 'express';
import { auth } from '../middleware/auth.js';
import { getOrders, createOrder, getOrderById, cancelOrder } from '../controller/orderController.js';

const router = express.Router();

router.get('/', auth, getOrders);
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderById);
router.put('/:id/cancel', auth, cancelOrder);

export default router;