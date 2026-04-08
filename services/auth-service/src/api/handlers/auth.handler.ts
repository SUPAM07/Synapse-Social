import { Request, Response, NextFunction } from 'express';
import { authService } from '../../application/services/auth.service';
import { ClientError } from '@uevent/utils';

export class AuthHandler {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ data: user, message: 'Registration successful. Check your email to confirm.' });
    } catch (err) {
      next(err);
    }
  }

  async confirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.confirmEmail({ token: req.query['token'] as string });
      res.json({ message: 'Email confirmed successfully' });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.login(req.body);
      res.json({ data: tokens });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refresh(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      await authService.logout(userId);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async sendPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.sendPasswordReset(req.body);
      res.json({ message: 'If that email exists, a reset link was sent.' });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authHandler = new AuthHandler();
