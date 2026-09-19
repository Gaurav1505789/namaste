const jwt = require('jsonwebtoken');

module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Admin login required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'namaste-demo-secret');
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Admin session expired' });
  }
};