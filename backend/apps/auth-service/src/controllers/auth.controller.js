const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { getDb, users, sessions } = require('@ai-event-organiser/database');
const { publishEvent, TOPICS } = require('@ai-event-organiser/kafka');
const { ConflictError, UnauthorizedError, NotFoundError } = require('@ai-event-organiser/common');

const SALT_ROUNDS = 12;

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
}

async function register(req, res, next) {
  try {
    const db = getDb();
    const { email, password, name } = req.body;

    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return next(new ConflictError('Email already registered'));
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
    }).returning();

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.insert(sessions).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    // Publish user registered event
    try {
      await publishEvent(TOPICS.USER_REGISTERED, user.id, {
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (kafkaErr) {
      console.error('Failed to publish user.registered event:', kafkaErr.message);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({
      status: 'success',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const db = getDb();
    const { email, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.insert(sessions).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({
      status: 'success',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const db = getDb();
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db.update(sessions)
        .set({ status: 'revoked' })
        .where(eq(sessions.token, refreshToken));
    }

    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const db = getDb();
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new UnauthorizedError('Refresh token required'));
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return next(new UnauthorizedError('Invalid refresh token'));
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.token, refreshToken));
    if (!session || session.status === 'revoked' || session.expiresAt < new Date()) {
      return next(new UnauthorizedError('Refresh token expired or revoked'));
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id));
    if (!user) {
      return next(new UnauthorizedError('User not found'));
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Revoke old session and create new one
    await db.update(sessions).set({ status: 'revoked' }).where(eq(sessions.token, refreshToken));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.insert(sessions).values({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    res.json({
      status: 'success',
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ status: 'success', data: { user: userWithoutPassword } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const db = getDb();
    const { name, imageUrl, hasCompletedOnboarding, locationCity, locationState, locationCountry, interests } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (hasCompletedOnboarding !== undefined) updates.hasCompletedOnboarding = hasCompletedOnboarding;
    if (locationCity !== undefined) updates.locationCity = locationCity;
    if (locationState !== undefined) updates.locationState = locationState;
    if (locationCountry !== undefined) updates.locationCountry = locationCountry;
    if (interests !== undefined) updates.interests = interests;
    updates.updatedAt = new Date();

    const [updated] = await db.update(users).set(updates).where(eq(users.id, req.user.id)).returning();
    const { passwordHash: _, ...userWithoutPassword } = updated;
    res.json({ status: 'success', data: { user: userWithoutPassword } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, refresh, getProfile, updateProfile };
