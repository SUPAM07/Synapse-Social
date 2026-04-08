import { Request, Response, NextFunction } from 'express';
import { userService } from '../../application/services/user.service';

export class UserHandler {
  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUser(req.params['id'] as string);
      res.json({ data: user });
    } catch (err) { next(err); }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const user = await userService.getUser(userId);
      res.json({ data: user });
    } catch (err) { next(err); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = (req as any).userId as string;
      const user = await userService.updateUser(req.params['id'] as string, requesterId, req.body);
      res.json({ data: user });
    } catch (err) { next(err); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = (req as any).userId as string;
      const requesterRole = (req as any).role as string;
      await userService.deleteUser(req.params['id'] as string, requesterId, requesterRole);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async getMyCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const companies = await userService.getUserCompanies(userId);
      res.json({ data: companies });
    } catch (err) { next(err); }
  }

  async getUserCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await userService.getUserCompanies(req.params['id'] as string);
      res.json({ data: companies });
    } catch (err) { next(err); }
  }

  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = (req as any).userId as string;
      const company = await userService.createCompany(ownerId, req.body);
      res.status(201).json({ data: company });
    } catch (err) { next(err); }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = (req as any).userId as string;
      const company = await userService.updateCompany(req.params['companyId'] as string, ownerId, req.body);
      res.json({ data: company });
    } catch (err) { next(err); }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = (req as any).userId as string;
      await userService.deleteCompany(req.params['companyId'] as string, ownerId);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const result = await userService.subscribeToCompany(userId, req.params['companyId'] as string);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      await userService.unsubscribeFromCompany(userId, req.params['companyId'] as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const subs = await userService.getUserSubscriptions(userId);
      res.json({ data: subs });
    } catch (err) { next(err); }
  }
}

export const userHandler = new UserHandler();
