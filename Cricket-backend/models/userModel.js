import { getDb } from '../config/database.js';

export const createUser = async (userData) => {
  const db = getDb();
  const { id, name, email, phone, password } = userData;
  await db.run(
    'INSERT INTO users (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, phone, password]
  );
};

export const findUserByEmail = async (email) => {
  const db = getDb();
  return await db.get('SELECT * FROM users WHERE email = ?', [email]);
};

export const findUserByPhone = async (phone) => {
  const db = getDb();
  return await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
};

export const findUserById = async (id) => {
  const db = getDb();
  return await db.get('SELECT id, name, email FROM users WHERE id = ?', [id]);
};