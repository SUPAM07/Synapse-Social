import jwt from 'jsonwebtoken';
import { sharedConfig } from '../config/index.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, sharedConfig.jwtSecret, {
    expiresIn: sharedConfig.jwtExpiresIn,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, sharedConfig.jwtRefreshSecret, {
    expiresIn: sharedConfig.jwtRefreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, sharedConfig.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, sharedConfig.jwtRefreshSecret);
}
