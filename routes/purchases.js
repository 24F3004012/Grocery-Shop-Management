const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { supplier_id: supplierId, purchase_date: purchaseDate, items } = req.body || {};

  try {
    if (!Number.isInteger(supplierId) || supplierId <= 0 || !isValidDate(purchaseDate) || !Array.isArray(items) || items.length === 0) {
      throw new Error('supplier_id, purchase_date, and at least one item are required.');
    }
    const totalCents = items.reduce((sum, item) => {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || typeof item.unit_cost !== 'number' || !Number.isFinite(item.unit_cost) || item.unit_cost < 0) {
        throw new Error('Each item requires a positive quantity and valid unit_cost.');
      }
      if (item.product_id !== undefined && (!Number.isInteger(item.product_id) || item.product_id <= 0)) {
        throw new Error('product_id must be a positive integer when provided.');
      }
      if (!Number.isInteger(item.product_id) && typeof item.product_name !== 'string') {
        throw new Error('Each item requires product_id or product_name.');
      }
      return sum + Math.round(item.quantity * item.unit_cost * 100);
    }, 0);

    const client = await pool.connect();
    const responseItems = [];
    try {
      await client.query('BEGIN');
      const supplierResult = await client.query('SELECT supplier_id FROM supplier WHERE supplier_id = $1 AND store_id = $2', [supplierId, req.user.store_id]);
      if (supplierResult.rowCount !== 1) throw new Error('Supplier does not belong to this store.');
      const purchaseResult = await client.query(
        `INSERT INTO purchase (store_id, supplier_id, purchase_date, total_amount)
         VALUES ($1, $2, $3, $4)
         RETURNING purchase_id, purchase_date`,
        [req.user.store_id, supplierId, purchaseDate, totalCents / 100],
      );
      const purchase = purchaseResult.rows[0];

      for (const item of items) {
        let productId = item.product_id;
        let createdNewProduct = false;
        if (!Number.isInteger(productId)) {
          if (!Number.isInteger(item.category_id) || item.category_id <= 0 || typeof item.unit !== 'string' || item.unit.length === 0 || typeof item.product_name !== 'string' || item.product_name.length === 0) {
            throw new Error('New products require product_name, category_id, and unit.');
          }
          const productResult = await client.query(
            `INSERT INTO product (store_id, category_id, name, unit_price, unit)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING product_id`,
            [req.user.store_id, item.category_id, item.product_name, 0, item.unit],
          );
          productId = productResult.rows[0].product_id;
          createdNewProduct = true;
        }

        await client.query(
          `INSERT INTO purchase_item (store_id, purchase_id, product_id, quantity, unit_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.store_id, purchase.purchase_id, productId, item.quantity, item.unit_cost],
        );
        responseItems.push({
          product_id: productId,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          ...(createdNewProduct ? { created_new_product: true } : {}),
        });
      }

      await client.query('COMMIT');
      return res.status(201).json({
        purchase_id: purchase.purchase_id,
        supplier_id: supplierId,
        purchase_date: purchase.purchase_date,
        total_amount: totalCents / 100,
        items: responseItems,
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

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

module.exports = router;