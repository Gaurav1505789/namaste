const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});

router.post('/login', (req, res) => {
  const { loginId, password } = req.body || {};
  const expectedId = process.env.ADMIN_LOGIN_ID || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (loginId !== expectedId || password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid admin login ID or password' });
  }

  const token = jwt.sign(
    { loginId: expectedId, role: 'admin' },
    process.env.JWT_SECRET || 'namaste-demo-secret',
    { expiresIn: '8h' }
  );

  return res.json({ success: true, token, loginId: expectedId });
});

module.exports = router;
