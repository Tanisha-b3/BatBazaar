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
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', adminAuth, async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    let days = 30;
    if (period === '7days') days = 7;
    else if (period === '90days') days = 90;

    const dateFilter = `NOW() - INTERVAL '${days} days'`;

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      ordersByStatus,
      topProducts,
      recentOrders,
      revenueByDay,
    ] = await Promise.all([
      db().query(`SELECT COUNT(*) as count FROM orders WHERE created_at > ${dateFilter}`),
      db().query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ('delivered', 'shipped') AND created_at > ${dateFilter}`),
      db().query('SELECT COUNT(*) as count FROM products'),
      db().query('SELECT COUNT(*) as count FROM users'),
      db().query(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        WHERE created_at > ${dateFilter}
        GROUP BY status
      `),
      db().query(`
        SELECT p.id, p.name, p.price, COALESCE(SUM(oi.quantity), 0) as sales, COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at > ${dateFilter}
        GROUP BY p.id
        ORDER BY sales DESC
        LIMIT 10
      `),
      db().query(`
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `),
      db().query(`
        SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
        FROM orders
        WHERE status IN ('delivered', 'shipped') AND created_at > ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date
      `),
    ]);

    const statusObj = ordersByStatus.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    const prevPeriodRevenue = await db().query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status IN ('delivered', 'shipped')
      AND created_at > NOW() - INTERVAL '${days * 2} days'
      AND created_at < NOW() - INTERVAL '${days} days'
    `);

    const prevPeriodOrders = await db().query(`
      SELECT COUNT(*) as count FROM orders WHERE created_at > NOW() - INTERVAL '${days * 2} days' AND created_at < NOW() - INTERVAL '${days} days'
    `);

    const currRevenue = parseFloat(totalRevenue.rows[0]?.total || 0);
    const prevRevenue = parseFloat(prevPeriodRevenue.rows[0]?.total || 0);
    const currOrders = parseInt(totalOrders.rows[0]?.count || 0);
    const prevOrders = parseInt(prevPeriodOrders.rows[0]?.count || 0);

    const revenueChange = prevRevenue > 0 ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100) : 0;
    const ordersChange = prevOrders > 0 ? Math.round(((currOrders - prevOrders) / prevOrders) * 100) : 0;

    res.json({
      totalOrders: currOrders,
      totalRevenue: currRevenue,
      totalProducts: parseInt(totalProducts.rows[0]?.count || 0),
      totalUsers: parseInt(totalUsers.rows[0]?.count || 0),
      revenueChange,
      ordersChange,
      pendingOrders: statusObj.pending || 0,
      processingOrders: statusObj.processing || 0,
      shippedOrders: statusObj.shipped || 0,
      deliveredOrders: statusObj.delivered || 0,
      cancelledOrders: statusObj.cancelled || 0,
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
      revenueByDay: revenueByDay.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

export default router;