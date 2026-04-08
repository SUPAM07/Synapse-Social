import { Request, Response, NextFunction } from 'express';
import { eventService } from '../../application/services/event.service';

export class CommentHandler {
  async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await eventService.getComments(req.params['eventId'] as string) });
    } catch (err) { next(err); }
  }

  async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const comment = await eventService.createComment(userId, req.params['eventId'] as string, req.body);
      res.status(201).json({ data: comment });
    } catch (err) { next(err); }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const role = (req as any).role as string;
      await eventService.deleteComment(req.params['id'] as string, userId, role);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const commentHandler = new CommentHandler();
