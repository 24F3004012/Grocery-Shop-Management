const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { customer_id: customerId, amount_paid: amountPaid, note = null } = req.body || {};
  if (!Number.isInteger(customerId) || customerId <= 0 || typeof amountPaid !== 'number' || !Number.isFinite(amountPaid) || amountPaid <= 0) {
    return res.status(400).json({ error: 'customer_id and a positive amount_paid are required.' });
  }
  if (note !== null && typeof note !== 'string') {
    return res.status(400).json({ error: 'note must be a string or null.' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const customerResult = await client.query('SELECT customer_id FROM customer WHERE customer_id = $1 AND store_id = $2', [customerId, req.user.store_id]);
    if (customerResult.rowCount !== 1) {
      const error = new Error(`Customer ${customerId} was not found.`);
      error.statusCode = 404;
      throw error;
    }
    const paymentResult = await client.query(
      `INSERT INTO credit_payment (store_id, customer_id, payment_date, amount_paid, note)
      VALUES ($1, $2, CURRENT_DATE, $3, $4)
       RETURNING payment_id, customer_id, amount_paid, payment_date, note`,
      [req.user.store_id, customerId, amountPaid, note],
    );
    const payment = paymentResult.rows[0];
    const balanceResult = await client.query(
      'SELECT balance_due AS customer_balance_due FROM customer WHERE customer_id = $1 AND store_id = $2',
      [customerId, req.user.store_id],
    );
    await client.query('COMMIT');
    return res.status(201).json({
      ...payment,
      amount_paid: Number(payment.amount_paid),
      customer_balance_due: Number(balanceResult.rows[0].customer_balance_due),
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    return res.status(error.statusCode || 400).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;