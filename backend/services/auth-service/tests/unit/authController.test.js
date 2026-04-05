import { jest } from '@jest/globals';

// ----- Mocks (must be declared before controller import) -----

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock('../../src/server.js', () => ({
  getRedis: jest.fn(() => mockRedis),
}));

jest.mock('../../src/models/User.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/middleware/jwt.js', () => ({
  signAccessToken: jest.fn(() => 'mock-access-token'),
  signRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import User from '../../src/models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/middleware/jwt.js';
import { getRedis } from '../../src/server.js';
import {
  register,
  login,
  refresh,
  logout,
} from '../../src/controllers/authController.js';

// ----- Helpers -----
function mockReq(body = {}, user = null, headers = {}) {
  return { body, user, headers };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ----- Tests -----

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(null);
    mockRedis.del.mockResolvedValue(1);
    getRedis.mockReturnValue(mockRedis);
  });

  // ----------------------------------------------------------------
  describe('register', () => {
    it('creates a user and returns tokens on success', async () => {
      const fakeUser = {
        _id: 'uid1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'customer',
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(fakeUser);

      const req = mockReq({ name: 'Alice', email: 'alice@example.com', password: 'secret1' });
      const res = mockRes();

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice', email: 'alice@example.com' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ accessToken: 'mock-access-token' }) })
      );
    });

    it('returns 400 when required fields are missing', async () => {
      const req = mockReq({ email: 'alice@example.com' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('returns 409 when email is already in use', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-uid' });

      const req = mockReq({ name: 'Bob', email: 'alice@example.com', password: 'secret1' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });

    it('stores refresh token in Redis after registration', async () => {
      const fakeUser = { _id: 'uid2', name: 'Carol', email: 'carol@example.com', role: 'customer' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(fakeUser);

      const req = mockReq({ name: 'Carol', email: 'carol@example.com', password: 'secret1' });
      const res = mockRes();

      await register(req, res);

      expect(mockRedis.set).toHaveBeenCalledWith(`refresh:${fakeUser._id}`, 'mock-refresh-token', 'EX', expect.any(Number));
    });
  });

  // ----------------------------------------------------------------
  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const fakeUser = {
        _id: 'uid3',
        name: 'Dave',
        email: 'dave@example.com',
        role: 'customer',
        isBlocked: false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser),
      });

      const req = mockReq({ email: 'dave@example.com', password: 'secret' });
      const res = mockRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ accessToken: 'mock-access-token' }) })
      );
    });

    it('returns 400 when fields are missing', async () => {
      const req = mockReq({ email: 'dave@example.com' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when user not found', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const req = mockReq({ email: 'nobody@example.com', password: 'pass' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is blocked', async () => {
      const blockedUser = {
        _id: 'uid4',
        email: 'blocked@example.com',
        isBlocked: true,
        comparePassword: jest.fn(),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(blockedUser) });

      const req = mockReq({ email: 'blocked@example.com', password: 'pass' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 401 on wrong password', async () => {
      const fakeUser = {
        _id: 'uid5',
        email: 'user@example.com',
        isBlocked: false,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

      const req = mockReq({ email: 'user@example.com', password: 'wrong' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ----------------------------------------------------------------
  describe('refresh', () => {
    it('returns new tokens when refresh token is valid', async () => {
      verifyRefreshToken.mockReturnValue({ id: 'uid6', email: 'eve@example.com', name: 'Eve', role: 'customer' });
      mockRedis.get.mockResolvedValue('mock-refresh-token');
      User.findById.mockResolvedValue({ _id: 'uid6', email: 'eve@example.com', name: 'Eve', role: 'customer', isBlocked: false });

      const req = mockReq({ refreshToken: 'mock-refresh-token' });
      const res = mockRes();

      await refresh(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ accessToken: 'mock-access-token' }) })
      );
    });

    it('returns 400 when refreshToken is missing', async () => {
      const req = mockReq({});
      const res = mockRes();

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 on invalid refresh token', async () => {
      verifyRefreshToken.mockImplementation(() => { throw new Error('invalid'); });

      const req = mockReq({ refreshToken: 'bad-token' });
      const res = mockRes();

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 on token reuse attempt', async () => {
      verifyRefreshToken.mockReturnValue({ id: 'uid7' });
      mockRedis.get.mockResolvedValue('other-token'); // stored token differs

      const req = mockReq({ refreshToken: 'mock-refresh-token' });
      const res = mockRes();

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Refresh token reuse detected' })
      );
    });
  });

  // ----------------------------------------------------------------
  describe('logout', () => {
    it('blacklists the access token and deletes the refresh token', async () => {
      const req = mockReq({}, { id: 'uid8' }, { authorization: 'Bearer some-access-token' });
      const res = mockRes();

      await logout(req, res);

      expect(mockRedis.set).toHaveBeenCalledWith('blacklist:some-access-token', '1', 'EX', expect.any(Number));
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:uid8');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('succeeds even without an authorization header', async () => {
      const req = mockReq({}, { id: 'uid9' }, {});
      const res = mockRes();

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
