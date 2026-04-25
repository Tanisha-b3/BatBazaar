import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pool;

export async function initializeDatabase() {
  try {
    // Create PostgreSQL connection pool
    pool = new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cricket_store',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
       ssl: {
    rejectUnauthorized: false, // 👈 REQUIRED for cloud DB
  },
    });

    // Test the connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(10),
        otp_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        old_price DECIMAL(10,2),
        category VARCHAR(50) NOT NULL,
        image VARCHAR(100),
        vendor VARCHAR(50),
        product_type VARCHAR(50),
        size VARCHAR(20),
        description TEXT,
        features TEXT,
        sizes TEXT,
        images TEXT,
        rating DECIMAL(3,2),
        reviews INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        in_stock BOOLEAN DEFAULT TRUE,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns if they don't exist (for existing databases)
const columnsToAdd = [
  { name: 'features', type: "TEXT DEFAULT '[]'" },
  { name: 'sizes', type: "TEXT DEFAULT '[]'" },
  { name: 'images', type: 'TEXT' },
  { name: 'stock', type: 'INTEGER DEFAULT 0' },
  { name: 'featured', type: 'BOOLEAN DEFAULT FALSE' },
  { name: 'in_stock', type: 'BOOLEAN DEFAULT TRUE' },
];
    
    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } catch (e) {
        // Column might already exist, ignore
      }
    }
    
    // Create cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);
    
    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'general',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        label VARCHAR(50) DEFAULT 'Home',
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Insert sample products if table is empty
    const productCount = await pool.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      const sampleProducts = [
        { name: 'SS Kashmir Willow Cricket Full Kit', price: 120, old_price: 180, category: 'kit', image: '/bat1.png', rating: 4.5, reviews: 50 },
        { name: 'MRF Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats', image: '/bat2.png', rating: 4.7, reviews: 89 },
        { name: 'SS TON Cricket Kit', price: 410, old_price: 800, category: 'kit', image: '/bat3.png', rating: 4.8, reviews: 120 },
        { name: 'Cricket Helmet', price: 210, old_price: 280, category: 'helmet', image: '/helmet.png', rating: 4.9, reviews: 56 },
        { name: 'Cricket Stumps', price: 80, old_price: 180, category: 'accessories', image: '/stumps.png', rating: 4.6, reviews: 203 },
        { name: 'Cricket Kit Bag', price: 120, old_price: 180, category: 'accessories', image: '/kit.png', rating: 4.5, reviews: 78 },
        { name: 'Cricket Bat', price: 100, old_price: 190, category: 'bats', image: '/bat2.png', rating: 4.4, reviews: 45 },
        { name: 'Cricket Stumps Set', price: 410, old_price: 800, category: 'accessories', image: '/stumps.png', rating: 4.7, reviews: 92 },
        { name: 'Cricket Gloves', price: 210, old_price: 280, category: 'accessories', image: '/gloves.png', rating: 4.8, reviews: 167 },
        { name: 'Cricket Pads', price: 150, old_price: 200, category: 'accessories', image: '/stumps.png', rating: 4.6, reviews: 67 },
        { name: 'SG Cricket Bat', price: 250, old_price: 350, category: 'bats', image: '/bat1.png', rating: 4.6, reviews: 34 },
        { name: 'GM Dynamo Cricket Bat', price: 300, old_price: 450, category: 'bats', image: '/bat2.png', rating: 4.7, reviews: 56 },
        { name: 'Cricket Helmet with Grill', price: 280, old_price: 380, category: 'helmet', image: '/helmet.png', rating: 4.8, reviews: 45 },
        { name: 'Cricket Keeping Gloves', price: 180, old_price: 250, category: 'accessories', image: '/gloves.png', rating: 4.5, reviews: 89 },
        { name: 'Cricket Wheelie Bag', price: 200, old_price: 300, category: 'kit', image: '/bag.png', rating: 4.6, reviews: 67 }
      ];
      
      for (const product of sampleProducts) {
        await pool.query(
          'INSERT INTO products (name, price, old_price, category, image, rating, reviews, available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [product.name, product.price, product.old_price, product.category, product.image, product.rating, product.reviews, true]
        );
      }
      console.log('✅ Sample products inserted');
    }
    
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin if not exists
    const adminExists = await pool.query('SELECT * FROM admins WHERE email = $1', ['admin@cricket.com']);
    if (adminExists.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
        ['Admin', 'admin@cricket.com', hashedPassword]
      );
      console.log('✅ Default admin created (admin@cricket.com / admin123)');
    }
    
    console.log('✅ PostgreSQL database initialized successfully');
    return pool;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export function getDb() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export default { initializeDatabase, getDb };