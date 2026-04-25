import express from 'express';
import { getDb } from '../config/database.js';

const router = express.Router();
const db = () => getDb();

const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'yourJwtSecretKeyHere123';
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone 
                FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id`;
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE o.status = $1';
      params.push(status);
    }
    query += ' ORDER BY o.id DESC';
    
    const result = await db().query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

router.get('/:id', adminAuth, async (req, res) => {
  try {
    const orderResult = await db().query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1`,
      [req.params.id]
    );
    const order = orderResult.rows[0];
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const itemsResult = await db().query(
      'SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [req.params.id]
    );
    
    order.items = itemsResult.rows;
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    await db().query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating order' });
  }
});

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Basic stats
    const productResult = await db().query('SELECT COUNT(*) as count FROM products');
    const orderResult = await db().query('SELECT COUNT(*) as count FROM orders');
    const revenueResult = await db().query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ('delivered', 'shipped')");
    const recentResult = await db().query("SELECT COUNT(*) as count FROM orders WHERE created_at > NOW() - INTERVAL '7 days'");
    const pendingResult = await db().query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const usersResult = await db().query('SELECT COUNT(*) as count FROM users');
    
    // Recent orders for dashboard
    const recentOrdersResult = await db().query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'
    );
    
    // Previous month stats for comparison
    const prevMonthRevenue = await db().query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status IN ('delivered', 'shipped')
      AND created_at > NOW() - INTERVAL '2 months'
      AND created_at < NOW() - INTERVAL '1 month'
    `);
    
    const currMonthRevenue = await db().query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status IN ('delivered', 'shipped')
      AND created_at > NOW() - INTERVAL '1 month'
    `);
    
    const prevMonthOrders = await db().query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at > NOW() - INTERVAL '2 months'
      AND created_at < NOW() - INTERVAL '1 month'
    `);
    
    const currMonthOrders = await db().query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at > NOW() - INTERVAL '1 month'
    `);
    
    const prevRevenue = parseFloat(prevMonthRevenue.rows[0]?.total || 0);
    const currRevenue = parseFloat(currMonthRevenue.rows[0]?.total || 0);
    const revenueChange = prevRevenue > 0 ? ((currRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    
    const prevOrders = parseInt(prevMonthOrders.rows[0]?.count || 0);
    const currOrders = parseInt(currMonthOrders.rows[0]?.count || 0);
    const ordersChange = prevOrders > 0 ? ((currOrders - prevOrders) / prevOrders) * 100 : 0;
    
    res.json({
      stats: {
        totalProducts: parseInt(productResult.rows[0].count),
        totalOrders: parseInt(orderResult.rows[0].count),
        totalRevenue: parseFloat(revenueResult.rows[0].total),
        recentOrders: parseInt(recentResult.rows[0].count),
        pendingOrders: parseInt(pendingResult.rows[0].count),
        totalUsers: parseInt(usersResult.rows[0].count),
        revenueChange: Math.round(revenueChange),
        ordersChange: Math.round(ordersChange)
      },
      recentOrders: recentOrdersResult.rows,
      lowStockProducts: []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

export default router;