import { Request, Response, NextFunction } from 'express';
import { promoCodeService } from '../../application/services/promo-code.service';

export class PromoCodeHandler {
  async getPromoCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.query;
      if (!eventId || typeof eventId !== 'string') {
        res.status(400).json({ error: 'ValidationError', message: 'eventId query parameter is required' });
        return;
      }
      const promoCodes = await promoCodeService.getPromoCodesByEvent(eventId);
      res.json({ data: promoCodes });
    } catch (err) { next(err); }
  }

  async getPromoCodeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await promoCodeService.getPromoCodeById(req.params['id'] as string);
      res.json({ data: promoCode });
    } catch (err) { next(err); }
  }

  async createPromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await promoCodeService.createPromoCode(req.body);
      res.status(201).json({ data: promoCode });
    } catch (err) { next(err); }
  }

  async updatePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await promoCodeService.updatePromoCode(req.params['id'] as string, req.body);
      res.json({ data: promoCode });
    } catch (err) { next(err); }
  }

  async deletePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await promoCodeService.deletePromoCode(req.params['id'] as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async validatePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { promoCode, eventId } = req.body;
      if (!promoCode || !eventId) {
        res.status(400).json({ error: 'ValidationError', message: 'promoCode and eventId are required' });
        return;
      }
      const result = await promoCodeService.validatePromoCode(promoCode, eventId);
      if (result) {
        res.json({ valid: true, discount: result.discount });
      } else {
        res.json({ valid: false });
      }
    } catch (err) { next(err); }
  }
}

export const promoCodeHandler = new PromoCodeHandler();
