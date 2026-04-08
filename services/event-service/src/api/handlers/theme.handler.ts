import { Request, Response, NextFunction } from 'express';
import { eventService } from '../../application/services/event.service';

export class ThemeHandler {
  async getThemes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await eventService.getThemes() });
    } catch (err) { next(err); }
  }

  async createTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ data: await eventService.createTheme(req.body.name) });
    } catch (err) { next(err); }
  }

  async deleteTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await eventService.deleteTheme(req.params['id'] as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const themeHandler = new ThemeHandler();
