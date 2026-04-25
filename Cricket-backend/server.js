import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
// import otpRoutes from './routes/otp.js';
import notificationRoutes from './routes/notifications.js';
import addressRoutes from './routes/addresses.js';
import { initializeDatabase, getDb } from './config/database.js';
import jwt from 'jsonwebtoken';
import adminRoutes from './routes/admin.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminProductRoutes from './routes/adminProducts.js';
import adminOrderRoutes from './routes/adminOrders.js';
import adminAnalyticsRoutes from './routes/adminAnalytics.js';
import uploadRoutes from './routes/upload.js';
import adminAddressRoutes from './routes/adminAddresses.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// // Middleware
// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.ADMIN_URL
// ];

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Cricket Store API' });
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/addresses', addressRoutes);

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/admins', adminRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/admin', adminAddressRoutes);

// Dashboard endpoint
app.get('/api/admin/dashboard', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'yourJwtSecretKeyHere123';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    
    const db = getDb();
    
    const productResult = await db.query('SELECT COUNT(*) as count FROM products');
    const orderResult = await db.query('SELECT COUNT(*) as count FROM orders');
    const revenueResult = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status IN ('delivered', 'shipped')");
    const recentResult = await db.query("SELECT COUNT(*) as count FROM orders WHERE created_at > NOW() - INTERVAL '7 days'");
    const pendingResult = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    
    const recentOrdersResult = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    
    const prevMonthRevenue = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status IN ('delivered', 'shipped')
      AND created_at > NOW() - INTERVAL '2 months'
      AND created_at < NOW() - INTERVAL '1 month'
    `);
    
    const currMonthRevenue = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status IN ('delivered', 'shipped')
      AND created_at > NOW() - INTERVAL '1 month'
    `);
    
    const prevMonthOrders = await db.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at > NOW() - INTERVAL '2 months'
      AND created_at < NOW() - INTERVAL '1 month'
    `);
    
    const currMonthOrders = await db.query(`
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
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Database: PostgreSQL`);
  });
}).catch(error => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});