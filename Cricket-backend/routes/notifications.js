import express from 'express';
import { auth } from '../middleware/auth.js';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controller/notificationController.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);

export default router;