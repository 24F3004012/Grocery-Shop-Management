const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS dashboard_date,
        COALESCE((SELECT SUM(total_amount) FROM cash_session WHERE store_id = $1 AND transaction_time::date = CURRENT_DATE), 0) AS today_cash,
        (SELECT COUNT(*) FROM cash_session WHERE store_id = $1 AND transaction_time::date = CURRENT_DATE) AS sales_count_today,
        (SELECT COUNT(*) FROM product WHERE store_id = $1 AND stock_on_hand <= reorder_level) AS low_stock_count,
        (SELECT COALESCE(SUM(GREATEST(balance_due, 0)), 0) FROM customer WHERE store_id = $1) AS credit_outstanding
      `, [req.user.store_id]);

    const row = result.rows[0];
    return res.json({
      date: row.dashboard_date,
      today_cash: Number(row.today_cash),
      low_stock_count: Number(row.low_stock_count),
      credit_outstanding: Number(row.credit_outstanding),
      sales_count_today: Number(row.sales_count_today),
    });
  } catch (error) {
    console.error('Dashboard query failed:', error.message);
    return res.status(503).json({ error: 'Dashboard data is temporarily unavailable.' });
  }
});

module.exports = router;