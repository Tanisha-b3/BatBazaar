import { getDb } from '../config/database.js';

export const getAllProducts = async (category = null) => {
  const db = getDb();
  let query = 'SELECT * FROM products WHERE available = 1';
  let params = [];
  
  if (category && category !== 'All Products') {
    const catMap = { 
      'Cricket Bats': 'bats', 
      'Accessories': 'accessories'
    };
    const cat = catMap[category];
    if (cat) {
      query += ' AND category = ?';
      params.push(cat);
    }
  }
  
  query += ' ORDER BY id';
  return await db.all(query, params);
};

export const getProductById = async (id) => {
  const db = getDb();
  return await db.get('SELECT * FROM products WHERE id = ?', [id]);
};