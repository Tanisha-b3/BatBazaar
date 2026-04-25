import express from 'express';
import { auth } from '../middleware/auth.js';
import { login, register, sendOTP, verifyOTP } from '../controller/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

export default router;