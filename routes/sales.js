const express = require('express');
const { pool } = require('../db');

const router = express.Router();

function validateItems(items, priceField) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items must contain at least one item.');
  }
  for (const item of items) {
    if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
      throw new Error('Each item requires a valid product_id.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Each item requires a positive integer quantity.');
    }
    if (typeof item[priceField] !== 'number' || !Number.isFinite(item[priceField]) || item[priceField] < 0) {
      throw new Error(`Each item requires a valid ${priceField}.`);
    }
  }
}

router.post('/', async (req, res) => {
  const { customer_id: customerId = null, items, cash_received: cashReceived } = req.body || {};

  try {
    validateItems(items, 'unit_price');
    if (customerId !== null && (!Number.isInteger(customerId) || customerId <= 0)) {
      throw new Error('customer_id must be a positive integer or null.');
    }
    if (typeof cashReceived !== 'number' || !Number.isFinite(cashReceived) || cashReceived < 0) {
      throw new Error('cash_received must be a non-negative number.');
    }

    const totalCents = items.reduce((sum, item) => sum + Math.round(item.quantity * item.unit_price * 100), 0);
    const cashReceivedCents = Math.round(cashReceived * 100);
    if (cashReceivedCents < totalCents) {
      return res.status(422).json({ error: 'cash_received is less than the sale total.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const productsResult = await client.query(
        'SELECT product_id FROM product WHERE store_id = $1 AND product_id = ANY($2::int[])',
        [req.user.store_id, items.map((item) => item.product_id)],
      );
      if (productsResult.rowCount !== new Set(items.map((item) => item.product_id)).size) throw new Error('One or more products do not belong to this store.');
      if (customerId !== null) {
        const customerResult = await client.query('SELECT customer_id FROM customer WHERE customer_id = $1 AND store_id = $2', [customerId, req.user.store_id]);
        if (customerResult.rowCount !== 1) throw new Error('Customer does not belong to this store.');
      }
      const saleResult = await client.query(
        `INSERT INTO cash_session
           (store_id, customer_id, transaction_time, total_amount, cash_received, change_given)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
         RETURNING session_id, transaction_time`,
        [req.user.store_id, customerId, totalCents / 100, cashReceivedCents / 100, (cashReceivedCents - totalCents) / 100],
      );
      const sale = saleResult.rows[0];

      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO cash_session_item (store_id, session_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.store_id, sale.session_id, item.product_id, item.quantity, item.unit_price],
        );
        if (itemResult.rowCount !== 1) throw new Error('Unable to record a sale item.');
      }

      await client.query('COMMIT');
      return res.status(201).json({
        session_id: sale.session_id,
        transaction_time: sale.transaction_time,
        total_amount: totalCents / 100,
        cash_received: cashReceivedCents / 100,
        change_given: (cashReceivedCents - totalCents) / 100,
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