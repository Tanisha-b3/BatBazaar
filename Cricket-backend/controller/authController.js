import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const db = () => getDb();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const existingUser = await db().query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const existingPhone = await db().query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    await db().query(
      'INSERT INTO users (id, name, email, phone, password) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, phone, hashedPassword]
    );
    
    const user = { id: userId, name, email };
    const tokens = generateTokens(user);
    
    res.status(201).json({ 
      message: 'Registration successful', 
      ...tokens,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    
    let user;
    if (email) {
      const result = await db().query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    } else if (phone) {
      const result = await db().query('SELECT * FROM users WHERE phone = $1', [phone]);
      user = result.rows[0];
    } else {
      return res.status(400).json({ message: 'Email or phone required' });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const userData = { id: user.id, email: user.email };
    const tokens = generateTokens(userData);
    
    res.json({ 
      message: 'Login successful', 
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const result = await db().query('SELECT id, name, email, phone FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;
    
    if (!name && !phone) {
      return res.status(400).json({ message: 'Name or phone required' });
    }
    
    if (phone) {
      const existing = await db().query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }
    
    const updates = [];
    const params = [];
    if (name) { 
      updates.push(`name = $${params.length + 1}`); 
      params.push(name); 
    }
    if (phone) { 
      updates.push(`phone = $${params.length + 1}`); 
      params.push(phone); 
    }
    params.push(userId);
    
    await db().query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    
    const result = await db().query('SELECT id, name, email, phone FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    
    const result = await db().query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db().query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

const otpStore = new Map();

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number required' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP required' });
    }
    
    const stored = otpStore.get(phone);
    
    if (!stored) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }
    
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }
    
    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    otpStore.delete(phone);
    
    let userResult = await db().query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user = userResult.rows[0];
    
    if (!user) {
      const userId = uuidv4();
      const tempPassword = await bcrypt.hash(phone + Date.now(), 10);
      await db().query(
        'INSERT INTO users (id, name, email, phone, password) VALUES ($1, $2, $3, $4, $5)',
        [userId, `User_${phone.slice(-4)}`, `${phone}@phone.local`, phone, tempPassword]
      );
      user = { id: userId, name: `User_${phone.slice(-4)}`, email: `${phone}@phone.local`, phone };
    }
    
    const userData = { id: user.id, email: user.email };
    const tokens = generateTokens(userData);
    
    res.json({ 
      message: 'Login successful', 
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

const resetTokenStore = new Map();

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const result = await db().query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetTokenStore.set(resetToken, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });
    
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ message: 'Password reset link sent to your email', resetToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password required' });
    }
    
    const stored = resetTokenStore.get(token);
    
    if (!stored) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    if (Date.now() > stored.expiresAt) {
      resetTokenStore.delete(token);
      return res.status(400).json({ message: 'Reset token expired' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db().query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, stored.userId]);
    
    resetTokenStore.delete(token);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const result = await db().query('SELECT id, name, email, phone FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const tokens = generateTokens({ id: user.id, email: user.email });
    
    res.json({ 
      message: 'Token refreshed',
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};