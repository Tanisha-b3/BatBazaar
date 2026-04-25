import express from 'express';
import { auth } from '../middleware/auth.js';
import { getCurrentUser, login, register, forgotPassword, resetPassword, updateProfile, changePassword, refreshToken, sendOTP, verifyOTP } from '../controller/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/user', auth, getCurrentUser);
router.put('/user', auth, updateProfile);
router.put('/user/password', auth, changePassword);

export default router;