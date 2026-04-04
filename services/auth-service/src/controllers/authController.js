import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/jwt.js';
import { getRedis } from '../server.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token in Redis
    const redis = getRedis();
    if (redis) {
      await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ success: false, message: 'Account is blocked' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const redis = getRedis();
    if (redis) {
      await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const redis = getRedis();
    if (redis) {
      const stored = await redis.get(`refresh:${decoded.id}`);
      if (stored !== refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked) return res.status(401).json({ success: false, message: 'User not found or blocked' });

    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    if (redis) {
      await redis.set(`refresh:${user._id}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);
    }

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const redis = getRedis();

    if (token && redis) {
      // Blacklist access token (TTL = 15 min)
      await redis.set(`blacklist:${token}`, '1', 'EX', 15 * 60);
    }

    if (req.user && redis) {
      await redis.del(`refresh:${req.user.id}`);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const { verifyAccessToken } = await import('../middleware/jwt.js');
    const decoded = verifyAccessToken(token);
    res.json({ success: true, data: decoded });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, interests: user.interests },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
