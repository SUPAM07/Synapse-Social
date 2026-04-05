import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../auth/index.js';
import { getRedisClient } from '../redis/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean;
}

/**
 * JWT authentication middleware (shared, usable in any service).
 * Checks token blacklist in Redis.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const { required = true } = options;

  return async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (!required) {
        next();
        return;
      }
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);

      // Check token blacklist
      const redis = getRedisClient();
      if (redis) {
        const blacklisted = await redis.get(`blacklist:${token}`);
        if (blacklisted) {
          res.status(401).json({ success: false, message: 'Token has been revoked' });
          return;
        }
      }

      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
}

/**
 * RBAC middleware – checks req.user.role against allowed roles.
 */
export function authorizeRoles(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  };
}
