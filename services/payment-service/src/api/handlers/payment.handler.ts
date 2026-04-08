import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../../application/services/payment.service';

export class PaymentHandler {
  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPayment(req.params['id'] as string);
      res.json({ data: payment });
    } catch (err) { next(err); }
  }

  async getPaymentByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPaymentByBookingId(req.params['bookingId'] as string);
      res.json({ data: payment });
    } catch (err) { next(err); }
  }
}

export const paymentHandler = new PaymentHandler();
