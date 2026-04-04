import { verifyAccessToken } from '../utils/jwt.js';
import { getRedisClient } from '../redis/index.js';

/**
 * JWT authentication middleware (shared, usable in any service).
 * Checks token blacklist in Redis.
 */
export function createAuthMiddleware(options = {}) {
  const { required = true } = options;

  return async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const decoded = verifyAccessToken(token);

      // Check token blacklist
      const redis = getRedisClient();
      if (redis) {
        const blacklisted = await redis.get(`blacklist:${token}`);
        if (blacklisted) {
          return res.status(401).json({ success: false, message: 'Token has been revoked' });
        }
      }

      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
}

/**
 * RBAC middleware – checks req.user.role against allowed roles.
 */
export function authorizeRoles(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
