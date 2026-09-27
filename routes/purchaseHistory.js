const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT purchase.purchase_id, purchase.purchase_date, purchase.supplier_id,
             supplier.name AS supplier_name, purchase.total_amount
      FROM purchase
      LEFT JOIN supplier ON supplier.supplier_id = purchase.supplier_id AND supplier.store_id = purchase.store_id
      WHERE purchase.store_id = $1
      ORDER BY purchase.purchase_date DESC, purchase.purchase_id DESC
    `, [req.user.store_id]);
    return res.json(result.rows.map((purchase) => ({
      ...purchase,
      total_amount: Number(purchase.total_amount),
    })));
  } catch (error) {
    console.error('Purchase history query failed:', error.message);
    return res.status(503).json({ error: 'Purchase history is temporarily unavailable.' });
  }
});

module.exports = router;