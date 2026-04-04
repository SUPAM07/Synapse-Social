const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('@ai-event-organiser/common');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next(new UnauthorizedError('Access token required'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

module.exports = { authenticateToken };
