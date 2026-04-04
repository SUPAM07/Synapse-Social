import { v4 as uuidv4 } from 'uuid';

export function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Date.now()}`;
}

export function generateQRCode() {
  return uuidv4();
}

export function calculatePagination(page, limit) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;
  return { offset, limit: parsedLimit, page: parsedPage };
}

export function formatDate(date) {
  return new Date(date).toISOString();
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
