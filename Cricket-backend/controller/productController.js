import { getDb } from '../config/database.js';

const db = () => getDb();

export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products WHERE available = true';
    let params = [];
    
    if (category && category !== 'all' && category !== 'All Products') {
      const catMap = { 
        'Cricket Bats': 'bats', 
        'Accessories': 'accessories',
        'Kit': 'kit',
        'Helmet': 'helmet',
        'kit': 'kit',
        'helmet': 'helmet',
        'bats': 'bats',
        'accessories': 'accessories'
      };
      const cat = catMap[category];
      if (cat) {
        query += ' AND category = $' + (params.length + 1);
        params.push(cat);
      }
    }
    
    query += ' ORDER BY id';
    
    const result = await db().query(query, params);
    res.json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const result = await db().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const product = result.rows[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let images = [];
    if (product.images) {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = product.images.split(',').map((img) => img.trim()).filter((img) => img);
      }
    }
    
    if (images.length === 0 && product.image) {
      images = [product.image];
    }
    
    res.json({ ...product, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const getTopSellers = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products WHERE available = true';
    let params = [];
    
    if (category && category !== 'all' && category !== 'All Products') {
      const catMap = { 
        'Cricket Bats': 'bats', 
        'Accessories': 'accessories',
        'Kit': 'kit',
        'Helmet': 'helmet',
        'kit': 'kit',
        'helmet': 'helmet',
        'bats': 'bats',
        'accessories': 'accessories'
      };
      const cat = catMap[category];
      if (cat) {
        query += ' AND category = $' + (params.length + 1);
        params.push(cat);
      }
    }
    
    query += ' ORDER BY id LIMIT 5';
    
    const result = await db().query(query, params);
    res.json({ products: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching top sellers' });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await db().query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.verified, r.created_at as date, u.name as user 
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = $1 
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const productResult = await db().query('SELECT category FROM products WHERE id = $1', [productId]);
    const product = productResult.rows[0];
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const relatedProducts = await db().query(
      `SELECT id, name, price, old_price, image, ((old_price - price) / old_price * 100) as discount 
       FROM products 
       WHERE category = $1 AND id != $2 AND available = true 
       LIMIT 5`,
      [product.category, productId]
    );
    
    res.json(relatedProducts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching related products' });
  }
};

export const rateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Please login to rate' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating' });
    }
    
    await db().query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating = $3, comment = $4, created_at = $6`,
      [productId, userId, rating, comment || '', true, new Date()]
    );
    
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting rating' });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    
    let query = `
      SELECT r.id, r.product_id, r.rating, r.comment, r.verified, r.created_at as date, u.name as user, p.name as product_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
    `;
    let params = [];
    
    if (productId) {
      query += ' WHERE r.product_id = $1';
      params.push(productId);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const result = await db().query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const getRecommendedForUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Please login' });
    }
    
    const recentProducts = await db().query(
      `SELECT DISTINCT oi.product_id 
       FROM order_items oi 
       JOIN orders o ON o.id = oi.order_id 
       WHERE o.user_id = $1 AND o.status IN ('delivered', 'completed')
       ORDER BY o.created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    if (recentProducts.rows.length === 0) {
      const fallback = await db().query(
        'SELECT id, name, price, old_price, image, ((old_price - price) / NULLIF(old_price, 0) * 100) as discount FROM products WHERE available = true ORDER BY id DESC LIMIT 5'
      );
      return res.json(fallback.rows);
    }
    
    const productIds = recentProducts.rows.map(p => p.product_id);
    
    const categories = await db().query(
      `SELECT DISTINCT category FROM products WHERE id = ANY($1)`,
      [productIds]
    );
    
    const categoryList = categories.rows.map(c => c.category);
    
    const recommended = await db().query(
      `SELECT id, name, price, old_price, image, ((old_price - price) / old_price * 100) as discount 
       FROM products 
       WHERE category = ANY($1) AND id != ALL($2) AND available = true
       ORDER BY RANDOM() 
       LIMIT 5`,
      [categoryList, productIds]
    );
    
    if (recommended.rows.length < 5) {
      const additional = await db().query(
        `SELECT id, name, price, old_price, image, ((old_price - price) / old_price * 100) as discount 
         FROM products 
         WHERE id != ALL($1) AND available = true
         ORDER BY RANDOM() 
         LIMIT $2`,
        [productIds, 5 - recommended.rows.length]
      );
      recommended.rows.push(...additional.rows);
    }
    
    res.json(recommended.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
};

export const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user?.id;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID required' });
    }
    
    const productResult = await db().query('SELECT category FROM products WHERE id = $1', [productId]);
    const product = productResult.rows[0];
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const coPurchased = await db().query(
      `SELECT p.id, p.name, p.price, p.old_price, p.image, 
              ((p.old_price - p.price) / p.old_price * 100) as discount,
              COUNT(*) as purchase_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (
         SELECT DISTINCT oi2.order_id 
         FROM order_items oi2 
         WHERE oi2.product_id = $1
       ) AND oi.product_id != $1
       AND o.status IN ('delivered', 'completed', 'shipped')
       GROUP BY p.id
       ORDER BY purchase_count DESC
       LIMIT 3`,
      [productId]
    );
    
    if (coPurchased.rows.length > 0) {
      return res.json(coPurchased.rows);
    }
    
    const fallback = await db().query(
      'SELECT id, name, price, old_price, image, ((old_price - price) / old_price * 100) as discount FROM products WHERE category = $1 AND id != $2 AND available = true ORDER BY RANDOM() LIMIT 3',
      [product.category, productId]
    );
    
    res.json(fallback.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
};