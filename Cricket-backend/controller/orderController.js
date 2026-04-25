import { getDb } from '../config/database.js';

const db = () => getDb();

export const getOrders = async (req, res) => {
  try {
    const orderResult = await db().query(
      `SELECT o.*
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    
    const orders = orderResult.rows;
    
    for (const order of orders) {
      const itemsResult = await db().query(
        `SELECT oi.*, p.name, p.image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }
    
    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderResult = await db().query(
      `SELECT o.*, oi.product_id, oi.quantity, oi.price, p.name, p.image
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    const order = orderResult.rows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching order' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    
    const orderResult = await db().query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, totalAmount, 'pending', shippingAddress || '']
    );
    
    const orderId = orderResult.rows[0].id;
    
    for (const item of items) {
      await db().query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }
    
    res.json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderResult = await db().query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const order = orderResult.rows[0];
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }
    
    await db().query('UPDATE orders SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
};