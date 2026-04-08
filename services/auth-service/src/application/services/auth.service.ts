import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { IUserRepository, PrismaUserRepository } from '../../infrastructure/repositories/user.repository';
import { kafkaPublisher } from '../../infrastructure/messaging/kafka.publisher';
import { PasswordVO } from '../../domain/value-objects/password.vo';
import { toPublicUser, PublicUser } from '../../domain/entities/user.entity';
import { RegisterDto, LoginDto, RefreshDto, ResetPasswordDto, SendPasswordResetDto, ConfirmEmailDto } from '../dto/auth.dto';
import { UnauthorizedError, NotFoundError, ValidationError, ClientError } from '@uevent/utils';
import { createLogger } from '@uevent/utils';
import { config } from '../../config';

const logger = createLogger('auth-service');

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepo: IUserRepository;

  constructor(userRepo?: IUserRepository) {
    this.userRepo = userRepo ?? new PrismaUserRepository();
  }

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existingLogin = await this.userRepo.findByLogin(dto.login);
    if (existingLogin) throw new ValidationError('Login already taken');

    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) throw new ValidationError('Email already registered');

    const passwordVO = await PasswordVO.create(dto.password);

    const user = await this.userRepo.create({
      login: dto.login,
      email: dto.email,
      password: passwordVO.toString(),
      fullName: dto.fullName,
      isConfirmed: false,
      role: 'user',
      picturePath: null,
    });

    const confirmToken = jwt.sign(
      { userId: user.id, type: 'email-confirm' },
      config.jwt.accessSecret,
      { expiresIn: '24h' },
    );

    await this.sendConfirmationEmail(user.email, user.fullName, confirmToken);

    try {
      await kafkaPublisher.publishUserRegistered({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        userId: user.id,
        login: user.login,
        email: user.email,
        fullName: user.fullName,
      });
    } catch (err) {
      logger.warn('Failed to publish UserRegistered event', { err });
    }

    return toPublicUser(user);
  }

  async confirmEmail(dto: ConfirmEmailDto): Promise<void> {
    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(dto.token, config.jwt.accessSecret) as { userId: string; type: string };
    } catch {
      throw new ValidationError('Invalid or expired confirmation token');
    }

    if (payload.type !== 'email-confirm') throw new ValidationError('Invalid token type');

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new NotFoundError('User');

    await this.userRepo.update(user.id, { isConfirmed: true });
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepo.findByLogin(dto.login);
    if (!user) throw new UnauthorizedError();

    const passwordVO = PasswordVO.fromHash(user.password);
    const valid = await passwordVO.compare(dto.password);
    if (!valid) throw new UnauthorizedError();

    if (!user.isConfirmed) throw new ClientError('Email not confirmed', 403);

    return this.generateTokens(user.id, user.role);
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    let payload: { userId: string; role: string; type: string };
    try {
      payload = jwt.verify(dto.refreshToken, config.jwt.refreshSecret) as {
        userId: string; role: string; type: string;
      };
    } catch {
      throw new UnauthorizedError();
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError();

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedError();

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, type: 'access' },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry },
    );

    return { accessToken };
  }

  async logout(_userId: string): Promise<void> {
    // In a production system, add the refresh token to a blocklist in Redis
    logger.info(`User logged out`);
  }

  async sendPasswordReset(dto: SendPasswordResetDto): Promise<void> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return; // Silently ignore to prevent email enumeration

    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      config.jwt.accessSecret,
      { expiresIn: '1h' },
    );

    await this.sendResetEmail(user.email, user.fullName, resetToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(dto.token, config.jwt.accessSecret) as { userId: string; type: string };
    } catch {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') throw new ValidationError('Invalid token type');

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new NotFoundError('User');

    const passwordVO = await PasswordVO.create(dto.newPassword);
    await this.userRepo.update(user.id, { password: passwordVO.toString() });

    try {
      await kafkaPublisher.publishUserUpdated({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        userId: user.id,
      });
    } catch (err) {
      logger.warn('Failed to publish UserUpdated event', { err });
    }
  }

  private generateTokens(userId: string, role: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, role, type: 'access' },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry },
    );
    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry },
    );
    return { accessToken, refreshToken };
  }

  private async sendConfirmationEmail(email: string, fullName: string, token: string): Promise<void> {
    try {
      const transporter = this.createMailTransporter();
      const confirmUrl = `${config.clientUrl}/confirm-email?token=${token}`;
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Confirm your Uevent account',
        html: `<p>Hello ${fullName},</p><p>Please confirm your email: <a href="${confirmUrl}">Confirm Email</a></p>`,
      });
    } catch (err) {
      logger.warn('Failed to send confirmation email', { err });
    }
  }

  private async sendResetEmail(email: string, fullName: string, token: string): Promise<void> {
    try {
      const transporter = this.createMailTransporter();
      const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Reset your Uevent password',
        html: `<p>Hello ${fullName},</p><p>Reset your password: <a href="${resetUrl}">Reset Password</a></p>`,
      });
    } catch (err) {
      logger.warn('Failed to send reset email', { err });
    }
  }

  private createMailTransporter() {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
}

export const authService = new AuthService();
