const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const COOKIE_NAME = 'sunanda_session';

function signSession(userId, storeId) {
  return jwt.sign({ user_id: userId, store_id: storeId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT app_user.user_id, app_user.email, store.store_id, store.store_name
       FROM app_user JOIN store ON store.owner_user_id = app_user.user_id
       WHERE app_user.user_id = $1 AND store.store_id = $2`,
      [payload.user_id, payload.store_id],
    );
    if (result.rowCount !== 1) return res.status(401).json({ error: 'Authentication required.' });
    req.user = result.rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
}

function setSessionCookie(res, userId, storeId) {
  res.cookie(COOKIE_NAME, signSession(userId, storeId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

module.exports = { COOKIE_NAME, requireAuth, setSessionCookie };
