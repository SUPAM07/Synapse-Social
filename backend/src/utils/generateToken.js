import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateJwtToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyJwtToken(token) {
  return jwt.verify(token, env.jwtSecret);
}


