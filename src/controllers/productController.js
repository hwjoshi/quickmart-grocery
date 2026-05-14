const db = require('../db');

// Get all products with their variants
const getAllProducts = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, p.name, p.description, p.category, p.image_url,
        json_agg(json_build_object('weight', v.weight_grams, 'price', v.price, 'sku', v.sku)) as variants
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      GROUP BY p.id
    `;
    const result = await db.query(query);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllProducts };