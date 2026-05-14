const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quickmart',
  password: 'Rashmi@007', // Replace with the password you set during PostgreSQL install
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};