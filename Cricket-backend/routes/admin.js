import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const db = () => getDb();

const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/create', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }

    // 🔥 Check if any admin exists
    const adminCount = await db().query('SELECT COUNT(*) FROM admins');

    if (parseInt(adminCount.rows[0].count) > 0) {
      // If admin exists → require token
      return verifyAdmin(req, res, async () => {
        await createAdminHandler(req, res);
      });
    }

    // First admin → allow directly
    await createAdminHandler(req, res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

const createAdminHandler = async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingAdmin = await db().query(
    'SELECT * FROM admins WHERE email = $1',
    [email]
  );

  if (existingAdmin.rows.length > 0) {
    return res.status(400).json({ message: 'Admin already exists' });
  }

  const result = await db().query(
    'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) RETURNING id',
    [name, email, hashedPassword]
  );

  res.status(201).json({
    message: 'Admin created successfully',
    admin: { id: result.rows[0].id, name, email }
  });
};

router.get('/list', verifyAdmin, async (req, res) => {
  try {
    const result = await db().query('SELECT id, name, email, created_at FROM admins ORDER BY id');
    res.json({ admins: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await db().query('DELETE FROM admins WHERE id = $1', [req.params.id]);
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

export default router;