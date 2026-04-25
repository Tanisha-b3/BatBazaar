#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const name = process.argv[2] || 'admin';
  const email = process.argv[3] || 'admin@cricket.com';
  const password = process.argv[4] || 'admin123';

  try {
    const pool = new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cricket_store',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    const client = await pool.connect();
    console.log('Connected to database');

    // Create admins table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existingAdmin = await client.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existingAdmin.rows.length > 0) {
      console.log('Admin already exists with this email');
      await client.query(
        'UPDATE admins SET name = $1, password = $2 WHERE email = $3',
        [name, hashedPassword, email]
      );
      console.log(`Admin updated: ${email} / ${password}`);
    } else {
      await client.query(
        'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
        [name, email, hashedPassword]
      );
      console.log(`Admin created: ${email} / ${password}`);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();