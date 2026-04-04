import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';
import { getDb } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/helpers.js';
import { config } from '../config/env.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

export async function register(email, password, name) {
  const existing = User.findByEmail(email);
  if (existing) throw new ConflictError('Email already in use');

  const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
  const user = User.create({ email, passwordHash, name });

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  _storeRefreshToken(user.id, refreshToken);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function login(email, password) {
  const user = User.findByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  _storeRefreshToken(user.id, refreshToken);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export function logout(refreshToken) {
  const db = getDb();
  db.prepare("UPDATE refresh_tokens SET status = 'revoked' WHERE token = ?").run(refreshToken);
}

export function refreshTokens(refreshToken) {
  const db = getDb();
  const tokenRecord = db.prepare("SELECT * FROM refresh_tokens WHERE token = ? AND status = 'active'").get(refreshToken);
  if (!tokenRecord) throw new UnauthorizedError('Invalid or expired refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = User.findById(payload.id);
  if (!user) throw new NotFoundError('User not found');

  db.prepare("UPDATE refresh_tokens SET status = 'revoked' WHERE token = ?").run(refreshToken);

  const newPayload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  _storeRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export function getProfile(userId) {
  const user = User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return sanitizeUser(user);
}

function _storeRefreshToken(userId, token) {
  const db = getDb();
  const id = uuidv4();
  const ttlMs = parseDuration(config.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)').run(id, userId, token, expiresAt);
}

function parseDuration(str) {
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86_400_000;
  return parseInt(match[1], 10) * (units[match[2]] || 86_400_000);
}
