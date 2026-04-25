import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

const router = express.Router();
const db = () => getDb();

const JWT_SECRET = process.env.JWT_SECRET || 'yourJwtSecretKeyHere123';

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', adminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (category && category !== 'all') {
      query += ' WHERE category = $1';
      params.push(category);
    }
    query += ' ORDER BY id DESC';
    
    const result = await db().query(query, params);
    res.json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.get('/:id', adminAuth, async (req, res) => {
  try {
    const result = await db().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const product = result.rows[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      name, price, old_price, category, image, description, available,
      features, sizes, images, stock, vendor, product_type, featured, in_stock
    } = req.body;
    
    const result = await db().query(
      `INSERT INTO products (
        name, price, old_price, category, image, description, available,
        features, sizes, stock, vendor, product_type, featured, in_stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        name, price, old_price || null, category, 
        image || '', description || '', available !== false,
        features || '[]', sizes || '[]', stock || 0, vendor || '',
        product_type || '', featured || false, in_stock !== false
      ]
    );
    
    res.status(201).json({ id: result.rows[0].id, message: 'Product created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { 
      name, price, old_price, category, image, description, available,
      features, sizes, images, stock, vendor, product_type, featured, in_stock
    } = req.body;
    
    await db().query(
      `UPDATE products SET 
        name = $1, price = $2, old_price = $3, category = $4, image = $5, 
        description = $6, available = $7, features = $8, sizes = $9, 
        stock = $10, vendor = $11, product_type = $12, featured = $13, in_stock = $14
      WHERE id = $15`,
      [
        name, price, old_price || null, category, image || '',
        description || '', available !== false, features || '[]', sizes || '[]',
        stock || 0, vendor || '', product_type || '', featured || false, in_stock !== false,
        req.params.id
      ]
    );
    
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await db().query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

export default router;