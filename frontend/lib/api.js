const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Core fetch wrapper for the Express REST API.
 *
 * @param {string} endpoint   - Path relative to the API base URL (e.g. "/events/me")
 * @param {string|null} token - Clerk JWT for authenticated requests
 * @param {RequestInit} options - Additional fetch options (method, body, headers…)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiCall(endpoint, token = null, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
