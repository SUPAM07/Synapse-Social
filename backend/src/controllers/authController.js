import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { updateProfileSchema } from '../utils/validation.js';
import { User } from '../models/User.js';
import { sanitizeUser } from '../utils/helpers.js';
import { ValidationError } from '../utils/errors.js';

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
    const user = authService.getProfile(req.user.id);
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
    const { error } = updateProfileSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const updated = User.update(req.user.id, req.body);
    return successResponse(res, { user: sanitizeUser(updated) }, 'Profile updated');
  } catch (err) {
    next(err);
  }
}
