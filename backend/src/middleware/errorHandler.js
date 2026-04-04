import { AppError } from '../utils/errors.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  if (config.NODE_ENV === 'development') {
    console.error(err);
  }

  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.details?.[0]?.message || err.message });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    return res.status(err.statusCode).json(body);
  }

  return res.status(500).json({ success: false, message: 'Internal server error' });
}
