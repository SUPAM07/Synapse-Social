import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../../application/services/booking.service';

export class BookingHandler {
  async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const result = await bookingService.getBookings({
        userId,
        page: Number(req.query['page']) || 1,
        limit: Number(req.query['limit']) || 20,
      });
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const userRole = (req as any).role as string;
      const booking = await bookingService.getBooking(req.params['id'] as string, userId, userRole);
      res.json({ data: booking });
    } catch (err) { next(err); }
  }

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const booking = await bookingService.createBooking(userId, req.body);
      res.status(201).json({ data: booking });
    } catch (err) { next(err); }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string;
      const userRole = (req as any).role as string;
      const booking = await bookingService.cancelBooking(req.params['id'] as string, userId, userRole);
      res.json({ data: booking });
    } catch (err) { next(err); }
  }
}

export const bookingHandler = new BookingHandler();
