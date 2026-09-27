const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT product_id, name, category_id, unit_price, unit, reorder_level, stock_on_hand
      FROM product
      WHERE store_id = $1
      ORDER BY product_id
    `, [req.user.store_id]);
    return res.json(result.rows.map((product) => ({
      ...product,
      unit_price: Number(product.unit_price),
      reorder_level: Number(product.reorder_level),
      stock_on_hand: Number(product.stock_on_hand),
    })));
  } catch (error) {
    console.error('Product list query failed:', error.message);
    return res.status(503).json({ error: 'Product data is temporarily unavailable.' });
  }
});

router.patch('/:id', async (req, res) => {
  const productId = Number(req.params.id);
  const { unit_price: unitPrice } = req.body || {};
  if (!Number.isInteger(productId) || productId <= 0 || typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return res.status(400).json({ error: 'A valid product ID and non-negative unit_price are required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE product
       SET unit_price = $1
      WHERE product_id = $2 AND store_id = $3
       RETURNING product_id, name, category_id, unit_price, unit, reorder_level, stock_on_hand`,
      [unitPrice, productId, req.user.store_id],
    );
    if (result.rowCount !== 1) return res.status(404).json({ error: `Product ${productId} was not found.` });
    const product = result.rows[0];
    return res.json({ ...product, unit_price: Number(product.unit_price), reorder_level: Number(product.reorder_level), stock_on_hand: Number(product.stock_on_hand) });
  } catch (error) {
    console.error('Product update failed:', error.message);
    return res.status(503).json({ error: 'Product could not be updated.' });
  }
});

module.exports = router;