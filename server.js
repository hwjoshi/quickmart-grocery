require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const authMiddleware = require('./src/middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, 'customer')
       RETURNING id, name, email`,
      [name, email, hashedPassword, phone || null, address || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user (protected)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, address, role FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Protect order creation – only logged in users
app.post('/api/orders', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { payment_method, address, substitution_preference, total_amount, items } = req.body;
    const userId = req.userId;
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, payment_method, address, substitution_preference, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [userId, payment_method, address, substitution_preference, total_amount]
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
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Public product routes (unchanged)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));