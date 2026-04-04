import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { User } from '../models/User.js';
import { sanitizeUser } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(
      req.body.email, req.body.password, req.body.name
    );
    return successResponse(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body.email, req.body.password);
    return successResponse(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) authService.logout(refreshToken);
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const rawUser = User.findById(req.user.id);
    if (!rawUser) throw new NotFoundError('User not found');
    const user = sanitizeUser(rawUser);
    return successResponse(res, { user }, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    const tokens = authService.refreshTokens(refreshToken);
    return successResponse(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    // Flatten a nested `location` object if provided by the frontend
    const body = { ...req.body };
    if (body.location && typeof body.location === 'object') {
      body.city = body.location.city ?? body.city;
      body.state = body.location.state ?? body.state;
      body.country = body.location.country ?? body.country;
      delete body.location;
    }

    // Map `hasCompletedOnboarding` → `isOnboarded` (both columns are kept in sync)
    if (typeof body.hasCompletedOnboarding !== 'undefined') {
      body.isOnboarded = body.hasCompletedOnboarding ? 1 : 0;
      // also persist in the new column
    }

    const updated = User.update(req.user.id, body);
    return successResponse(res, { user: sanitizeUser(updated) }, 'Profile updated');
  } catch (err) {
    next(err);
  }
}
