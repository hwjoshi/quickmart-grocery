require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { Pool } = require('pg');
const passport = require('./src/config/passport');

const app = express();
app.use(cors());
app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using https
}));
app.use(passport.initialize());
app.use(passport.session());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ========== PUBLIC ROUTES ==========
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, category, image_url, is_perishable
      FROM products ORDER BY id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/variants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, product_id, weight_grams AS weight, price, 'g' AS unit
      FROM variants ORDER BY product_id, weight
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== AUTH ROUTES (Email/Password) ==========
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, 'customer') RETURNING id, name, email`,
      [name, email, hashed, phone || null, address || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========== OAuth Routes ==========
// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    if (!req.user) {
      console.error('No user from Google');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
    }
    try {
      const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${process.env.FRONTEND_URL}/oauth-redirect?token=${token}`);
    } catch (err) {
      console.error('JWT sign error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
    }
  }
);

// Facebook OAuth
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    if (!req.user) {
      console.error('No user from Facebook');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
    }
    try {
      const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${process.env.FRONTEND_URL}/oauth-redirect?token=${token}`);
    } catch (err) {
      console.error('JWT sign error:', err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
    }
  }
);

// ========== PROTECTED USER ROUTES ==========
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4',
      [name, phone, address, req.userId]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Change password
app.put('/api/user/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user.password_hash) return res.status(400).json({ error: 'No password set (social login user). Use "Forgot password" feature.' });
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.userId]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get order history
app.get('/api/user/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at,
             json_agg(json_build_object(
               'product_name', p.name,
               'quantity', oi.quantity,
               'weight', oi.ordered_weight_grams,
               'price', oi.unit_price
             )) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.userId]);
    res.json(orders.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Place order (protected)
app.post('/api/orders', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { payment_method, address, substitution_preference, total_amount, items } = req.body;
    const userId = req.userId;
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, payment_method, address, substitution_preference, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
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
    res.status(201).json({ orderId, message: 'Order placed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));