import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'yourJwtSecretKeyHere123';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[addresses] GET / called, userId:', req.user.id);
    const db = getDb();
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
      [userId]
    );
    console.log('[addresses] Result rows:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('[addresses] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;

    if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (is_default) {
      await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const result = await db.query(`
      INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [userId, label || 'Home', full_name, phone, address_line1, address_line2 || null, city, state, pincode, country || 'India', is_default || false]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user.id;
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;

    const existing = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Address not found' });

    if (is_default) {
      await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    await db.query(`
      UPDATE addresses SET label = $1, full_name = $2, phone = $3, address_line1 = $4, address_line2 = $5, city = $6, state = $7, pincode = $8, country = $9, is_default = $10
      WHERE id = $11 AND user_id = $12
    `, [label, full_name, phone, address_line1, address_line2 || null, city, state, pincode, country, is_default, id, userId]);

    res.json({ message: 'Address updated' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user.id;
    await db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/default', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user.id;

    const address = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (address.rows.length === 0) return res.status(404).json({ message: 'Address not found' });

    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    await db.query('UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ message: 'Default address updated' });
  } catch (error) {
    console.error('Set default error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;