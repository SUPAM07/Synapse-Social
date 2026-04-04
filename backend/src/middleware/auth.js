import jwt from 'jsonwebtoken';
import { createClerkClient } from '@clerk/express';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { User } from '../models/User.js';

// Initialise the Clerk client once.  When CLERK_SECRET_KEY is absent (e.g.
// unit tests / local runs without Clerk) the client is still created but
// `verifyToken` will fall back to the legacy JWT path.
const clerkClient = createClerkClient({
  secretKey: config.CLERK_SECRET_KEY || '',
  publishableKey: config.CLERK_PUBLISHABLE_KEY || '',
});

/**
 * Verify a Clerk session JWT and return the payload (contains `sub` = Clerk
 * user ID, `email`, `name`, `image_url`, etc.).  Returns null when the token
 * cannot be verified as a Clerk token.
 */
async function verifyClerkToken(token) {
  try {
    return await clerkClient.verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Build a local user from a Clerk JWT payload, creating one in SQLite if it
 * does not already exist.
 */
function resolveLocalUser(clerkPayload) {
  const clerkId = clerkPayload.sub;
  let user = User.findByClerkId(clerkId);
  if (!user) {
    const email =
      clerkPayload.email ||
      (clerkPayload.email_addresses?.[0]?.email_address) ||
      `${clerkId}@clerk.local`;
    const name =
      clerkPayload.name ||
      clerkPayload.full_name ||
      (clerkPayload.first_name
        ? `${clerkPayload.first_name} ${clerkPayload.last_name || ''}`.trim()
        : email.split('@')[0]);
    const imageUrl = clerkPayload.image_url || clerkPayload.profile_image_url || null;
    user = User.upsertFromClerk({ clerkId, email, name, imageUrl });
  }
  return { id: user.id, email: user.email, role: user.role, clerkId };
}

/**
 * Main auth middleware.
 * 1. If a valid Clerk JWT is presented, the corresponding local user is
 *    looked up (or auto-created) and attached to `req.user`.
 * 2. Falls back to legacy HS256 JWT verification so that existing tooling /
 *    direct API access continues to work.
 */
export async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // --- Clerk path ---
    if (config.CLERK_SECRET_KEY) {
      const clerkPayload = await verifyClerkToken(token);
      if (clerkPayload) {
        req.user = resolveLocalUser(clerkPayload);
        return next();
      }
    }

    // --- Legacy HS256 JWT path ---
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    next();
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      if (config.CLERK_SECRET_KEY) {
        const clerkPayload = await verifyClerkToken(token);
        if (clerkPayload) {
          req.user = resolveLocalUser(clerkPayload);
          return next();
        }
      }
      // Legacy path
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
      } catch { /* invalid token – proceed unauthenticated */ }
    }
    next();
  } catch {
    next();
  }
}