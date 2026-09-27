const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { COOKIE_NAME, requireAuth, setSessionCookie } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  const storeName = typeof req.body?.store_name === 'string' ? req.body.store_name.trim() : '';
  if (!email || typeof password !== 'string' || password.length < 8 || !storeName) {
    return res.status(400).json({ error: 'email, a password of at least 8 characters, and store_name are required.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query('INSERT INTO app_user (email, password_hash) VALUES ($1, $2) RETURNING user_id', [email, passwordHash]);
    const storeResult = await client.query('INSERT INTO store (owner_user_id, store_name) VALUES ($1, $2) RETURNING store_id, store_name', [userResult.rows[0].user_id, storeName]);
    await client.query('COMMIT');
    setSessionCookie(res, userResult.rows[0].user_id, storeResult.rows[0].store_id);
    return res.status(201).json({ user_id: userResult.rows[0].user_id, store_id: storeResult.rows[0].store_id, store_name: storeResult.rows[0].store_name });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    console.error('Registration failed:', error.message);
    return res.status(503).json({ error: 'Registration is temporarily unavailable.' });
  } finally { client.release(); }
});

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!email || typeof password !== 'string') return res.status(400).json({ error: 'email and password are required.' });
  try {
    const result = await pool.query(`SELECT app_user.user_id, app_user.password_hash, store.store_id, store.store_name FROM app_user JOIN store ON store.owner_user_id = app_user.user_id WHERE app_user.email = $1`, [email]);
    if (result.rowCount !== 1 || !(await bcrypt.compare(password, result.rows[0].password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
    const account = result.rows[0];
    setSessionCookie(res, account.user_id, account.store_id);
    return res.json({ user_id: account.user_id, store_id: account.store_id, store_name: account.store_name });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(503).json({ error: 'Login is temporarily unavailable.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ message: 'Logged out. Your store data was preserved.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user_id: req.user.user_id, email: req.user.email, store_id: req.user.store_id, store_name: req.user.store_name }));

module.exports = router;
