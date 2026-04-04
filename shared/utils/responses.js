/**
 * Standard success response
 */
export function successResponse(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Standard error response
 */
export function errorResponse(res, message = 'Error', statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Paginated success response
 */
export function paginatedResponse(res, data, pagination) {
  return res.status(200).json({ success: true, data, pagination });
}
