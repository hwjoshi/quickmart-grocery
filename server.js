require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, category, image_url, is_perishable
      FROM products
      ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all variants
app.get('/api/variants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, product_id, weight_grams AS weight, price, 'g' AS unit
      FROM variants
      ORDER BY product_id, weight
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { user_id, payment_method, address, substitution_preference, total_amount, items } = req.body;
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, payment_method, address, substitution_preference, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [user_id || null, payment_method, address, substitution_preference, total_amount]
    );
    const orderId = orderResult.rows[0].id;
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, ordered_weight_grams, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.variant_id, item.weight_grams, item.price, item.quantity]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));