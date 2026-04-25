import { getDb } from '../config/database.js';

export const getCartItems = async (userId) => {
  const db = getDb();
  return await db.all(`
    SELECT c.product_id, c.quantity, p.* 
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `, [userId]);
};

export const addCartItem = async (userId, productId, quantity) => {
  const db = getDb();
  const existing = await db.get(
    'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  
  if (existing) {
    await db.run(
      'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );
  } else {
    await db.run(
      'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [userId, productId, quantity]
    );
  }
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
  const db = getDb();
  if (quantity <= 0) {
    await db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
  } else {
    await db.run('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
  }
};

export const removeCartItem = async (userId, productId) => {
  const db = getDb();
  await db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
};

export const clearUserCart = async (userId) => {
  const db = getDb();
  await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
};