import jwt from 'jsonwebtoken';
import { env } from '../config.js';

/**
 * Optional auth middleware – populates req.user if valid token present.
 * Does NOT reject requests without a token (gateway routes may be public).
 * Each service can enforce additional auth.
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, env.jwtSecret);
    } catch {
      // invalid token – leave req.user empty; downstream service will reject
    }
  }
  next();
}
