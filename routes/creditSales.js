const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { customer_id: customerId, items } = req.body || {};

  try {
    if (!Number.isInteger(customerId) || customerId <= 0 || !Array.isArray(items) || items.length === 0) {
      throw new Error('customer_id and at least one item are required.');
    }
    const totalCents = items.reduce((sum, item) => {
      if (!Number.isInteger(item.product_id) || item.product_id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0) {
        throw new Error('Each item requires valid product_id, quantity, and unit_price.');
      }
      return sum + Math.round(item.quantity * item.unit_price * 100);
    }, 0);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const saleResult = await client.query(
        `INSERT INTO credit_sale (customer_id, transaction_time, total_amount)
         VALUES ($1, CURRENT_TIMESTAMP, $2)
         RETURNING credit_id, transaction_time`,
        [customerId, totalCents / 100],
      );
      const sale = saleResult.rows[0];
      for (const item of items) {
        await client.query(
          `INSERT INTO credit_sale_item (credit_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [sale.credit_id, item.product_id, item.quantity, item.unit_price],
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({
        credit_id: sale.credit_id,
        customer_id: customerId,
        transaction_time: sale.transaction_time,
        total_amount: totalCents / 100,
        items,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;