const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT supplier_id, name, phone FROM supplier WHERE store_id = $1 ORDER BY name, supplier_id', [req.user.store_id]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Supplier list query failed:', error.message);
    return res.status(503).json({ error: 'Supplier data is temporarily unavailable.' });
  }
});

router.get('/:id', async (req, res) => {
  const supplierId = Number(req.params.id);
  if (!Number.isInteger(supplierId) || supplierId <= 0) return res.status(400).json({ error: 'Supplier ID must be a positive integer.' });

  try {
    const supplierResult = await pool.query(
      'SELECT supplier_id, name, phone FROM supplier WHERE supplier_id = $1 AND store_id = $2',
      [supplierId, req.user.store_id],
    );
    if (supplierResult.rowCount !== 1) return res.status(404).json({ error: `Supplier ${supplierId} was not found.` });

    const purchasesResult = await pool.query(
      `SELECT purchase_id, purchase_date, total_amount
       FROM purchase
      WHERE supplier_id = $1 AND store_id = $2
       ORDER BY purchase_date DESC, purchase_id DESC`,
      [supplierId, req.user.store_id],
    );
    return res.json({
      ...supplierResult.rows[0],
      purchases: purchasesResult.rows.map((purchase) => ({
        ...purchase,
        total_amount: Number(purchase.total_amount),
      })),
    });
  } catch (error) {
    console.error('Supplier detail query failed:', error.message);
    return res.status(503).json({ error: 'Supplier data is temporarily unavailable.' });
  }
});

module.exports = router;