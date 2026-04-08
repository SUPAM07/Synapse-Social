import { AuthService } from '../src/application/services/auth.service';
import { IUserRepository } from '../src/infrastructure/repositories/user.repository';
import { UserEntity } from '../src/domain/entities/user.entity';

jest.mock('../src/infrastructure/messaging/kafka.publisher', () => ({
  kafkaPublisher: {
    publishUserRegistered: jest.fn().mockResolvedValue(undefined),
    publishUserUpdated: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/config', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiry: '15m',
      refreshExpiry: '7d',
    },
    smtp: { host: '', port: 587, user: '', pass: '', from: '' },
    clientUrl: 'http://localhost:5173',
  },
}));

const mockUser: UserEntity = {
  id: 'test-uuid',
  login: 'testuser',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  isConfirmed: true,
  fullName: 'Test User',
  picturePath: null,
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockRepo = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findById: jest.fn().mockResolvedValue(mockUser),
  findByLogin: jest.fn().mockResolvedValue(null),
  findByEmail: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ ...mockUser, isConfirmed: false }),
  update: jest.fn().mockResolvedValue(mockUser),
  delete: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user and return public user', async () => {
      const repo = createMockRepo();
      const service = new AuthService(repo);

      const result = await service.register({
        login: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        fullName: 'New User',
      });

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('password');
      expect(result.login).toBe('testuser');
    });

    it('should throw ValidationError if login is taken', async () => {
      const repo = createMockRepo({ findByLogin: jest.fn().mockResolvedValue(mockUser) });
      const service = new AuthService(repo);

      await expect(
        service.register({ login: 'testuser', email: 'a@b.com', password: 'Password123!', fullName: 'Test' }),
      ).rejects.toThrow('Login already taken');
    });

    it('should throw ValidationError if email is taken', async () => {
      const repo = createMockRepo({ findByEmail: jest.fn().mockResolvedValue(mockUser) });
      const service = new AuthService(repo);

      await expect(
        service.register({ login: 'newuser', email: 'test@example.com', password: 'Password123!', fullName: 'Test' }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError for unknown login', async () => {
      const repo = createMockRepo({ findByLogin: jest.fn().mockResolvedValue(null) });
      const service = new AuthService(repo);

      await expect(service.login({ login: 'unknown', password: 'password' })).rejects.toThrow('Unauthorized');
    });

    it('should throw ClientError if email not confirmed', async () => {
      const unconfirmedUser = { ...mockUser, isConfirmed: false };
      const repo = createMockRepo({ findByLogin: jest.fn().mockResolvedValue(unconfirmedUser) });
      const service = new AuthService(repo);

      await expect(service.login({ login: 'testuser', password: 'anypassword' })).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should complete without error', async () => {
      const service = new AuthService(createMockRepo());
      await expect(service.logout('test-uuid')).resolves.toBeUndefined();
    });
  });
});
