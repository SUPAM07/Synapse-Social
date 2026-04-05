import jwt from 'jsonwebtoken';
import { sharedConfig } from '../config/index.js';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'organizer' | 'admin';
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, sharedConfig.jwtSecret, {
    expiresIn: sharedConfig.jwtExpiresIn as unknown as number,
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload as any, sharedConfig.jwtRefreshSecret, {
    expiresIn: sharedConfig.jwtRefreshExpiresIn as unknown as number,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, sharedConfig.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, sharedConfig.jwtRefreshSecret) as JwtPayload;
}
