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
       VALUES ($1, $2, $3, $4, $5, 'customer') RETURNING id, name, email, role`,
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
    const result = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========== OAuth Routes ==========
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

// Get current user info (includes role)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, avatar_url, role, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

// ========== ADMIN ROUTES (require admin role) ==========
const adminMiddleware = require('./src/middleware/admin');

// Products
app.get('/api/admin/products', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, json_agg(json_build_object('id', v.id, 'weight_grams', v.weight_grams, 'price', v.price, 'sku', v.sku)) as variants
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      GROUP BY p.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products', adminMiddleware, async (req, res) => {
  const { name, description, category, image_url, is_perishable } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, category, image_url, is_perishable) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, category, image_url, is_perishable]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, category, image_url, is_perishable } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, description=$2, category=$3, image_url=$4, is_perishable=$5 WHERE id=$6 RETURNING *',
      [name, description, category, image_url, is_perishable, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Variants
app.post('/api/admin/variants', adminMiddleware, async (req, res) => {
  const { product_id, weight_grams, price, sku } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO variants (product_id, weight_grams, price, sku) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, weight_grams, price, sku]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/variants/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { weight_grams, price, sku } = req.body;
  try {
    const result = await pool.query(
      'UPDATE variants SET weight_grams=$1, price=$2, sku=$3 WHERE id=$4 RETURNING *',
      [weight_grams, price, sku, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/variants/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM variants WHERE id=$1', [id]);
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
app.get('/api/admin/inventory', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ib.*, v.product_id, p.name as product_name, v.weight_grams
      FROM inventory_batches ib
      JOIN variants v ON ib.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      ORDER BY ib.expiry_date
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/inventory', adminMiddleware, async (req, res) => {
  const { variant_id, quantity_grams, expiry_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO inventory_batches (variant_id, quantity_grams, expiry_date) VALUES ($1, $2, $3) RETURNING *',
      [variant_id, quantity_grams, expiry_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/inventory/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM inventory_batches WHERE id=$1', [id]);
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.name as user_name, u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id/status', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Slots
app.get('/api/admin/slots', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM delivery_slots ORDER BY slot_date, start_time');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/slots', adminMiddleware, async (req, res) => {
  const { slot_date, start_time, end_time, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO delivery_slots (slot_date, start_time, end_time, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [slot_date, start_time, end_time, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/slots/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { slot_date, start_time, end_time, capacity, booked } = req.body;
  try {
    const result = await pool.query(
      'UPDATE delivery_slots SET slot_date=$1, start_time=$2, end_time=$3, capacity=$4, booked=$5 WHERE id=$6 RETURNING *',
      [slot_date, start_time, end_time, capacity, booked, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/slots/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM delivery_slots WHERE id=$1', [id]);
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));