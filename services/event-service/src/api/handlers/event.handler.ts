import { Request, Response, NextFunction } from 'express';
import { eventService } from '../../application/services/event.service';

export class EventHandler {
  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await eventService.getEvents({
        page: Number(req.query['page']) || 1,
        limit: Number(req.query['limit']) || 20,
        formatId: req.query['formatId'] as string | undefined,
        themeId: req.query['themeId'] as string | undefined,
        search: req.query['search'] as string | undefined,
        organizerId: req.query['organizerId'] as string | undefined,
      });
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.getEvent(req.params['id'] as string);
      res.json({ data: event });
    } catch (err) { next(err); }
  }

  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = (req as any).userId as string;
      const event = await eventService.createEvent(organizerId, req.body);
      res.status(201).json({ data: event });
    } catch (err) { next(err); }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = (req as any).userId as string;
      const requesterRole = (req as any).role as string;
      const event = await eventService.updateEvent(req.params['id'] as string, requesterId, requesterRole, req.body);
      res.json({ data: event });
    } catch (err) { next(err); }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requesterId = (req as any).userId as string;
      const requesterRole = (req as any).role as string;
      await eventService.deleteEvent(req.params['id'] as string, requesterId, requesterRole);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const eventHandler = new EventHandler();
