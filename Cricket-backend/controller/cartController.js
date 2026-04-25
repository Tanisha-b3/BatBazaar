import { getDb } from '../config/database.js';

const db = () => getDb();

export const getCart = async (req, res) => {
  try {
    const result = await db().query(
      `SELECT c.product_id, c.quantity, p.* 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    
    const cartProducts = result.rows.map(item => ({
      id: item.product_id,
      name: item.name,
      price: item.price,
      old_price: item.old_price,
      category: item.category,
      image: item.image,
      rating: item.rating,
      reviews: item.reviews,
      quantity: item.quantity
    }));
    
    res.json({ cart: cartProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const productResult = await db().query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const existingResult = await db().query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );
    
    if (existingResult.rows.length > 0) {
      await db().query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, productId]
      );
    } else {
      await db().query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, productId, quantity]
      );
    }
    
    const cartResult = await db().query(
      'SELECT product_id, quantity FROM cart WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({ message: 'Added to cart', cart: cartResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (quantity <= 0) {
      await db().query(
        'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
        [req.user.id, productId]
      );
    } else {
      await db().query(
        'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, productId]
      );
    }
    
    const cartResult = await db().query(
      'SELECT product_id, quantity FROM cart WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({ message: 'Cart updated', cart: cartResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating cart' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    await db().query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    
    const cartResult = await db().query(
      'SELECT product_id, quantity FROM cart WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({ message: 'Item removed', cart: cartResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing item' });
  }
};

export const clearCart = async (req, res) => {
  try {
    await db().query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
};