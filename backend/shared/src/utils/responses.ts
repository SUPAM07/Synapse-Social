import type { Response } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Standard success response
 */
export function successResponse(
  res: Response,
  data: unknown = {},
  message = 'Success',
  statusCode = 200
): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Standard error response
 */
export function errorResponse(
  res: Response,
  message = 'Error',
  statusCode = 500,
  errors: unknown = null
): Response {
  const body: Record<string, unknown> = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Paginated success response
 */
export function paginatedResponse(
  res: Response,
  data: unknown[],
  pagination: PaginationMeta
): Response {
  return res.status(200).json({ success: true, data, pagination });
}
