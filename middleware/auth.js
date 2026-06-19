const jwt = require('jsonwebtoken');

// ── JWT Authentication Middleware ────────────────────────────
// Protects routes by verifying the Bearer token in the
// Authorization header. Attaches { id } to req.user on success.

module.exports = function (req, res, next) {
  // 1. Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Attach user id to request
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};
