import { Request, Response, NextFunction } from 'express';
import { eventService } from '../../application/services/event.service';

export class FormatHandler {
  async getFormats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await eventService.getFormats() });
    } catch (err) { next(err); }
  }

  async createFormat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ data: await eventService.createFormat(req.body.name) });
    } catch (err) { next(err); }
  }

  async deleteFormat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await eventService.deleteFormat(req.params['id'] as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const formatHandler = new FormatHandler();
