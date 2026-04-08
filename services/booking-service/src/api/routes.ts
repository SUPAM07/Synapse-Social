import { Router } from 'express';
import { bookingHandler } from './handlers/booking.handler';
import { promoCodeHandler } from './handlers/promo-code.handler';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'booking-service' }));
router.get('/bookings', bookingHandler.getBookings.bind(bookingHandler));
router.get('/bookings/:id', bookingHandler.getBooking.bind(bookingHandler));
router.post('/bookings', bookingHandler.createBooking.bind(bookingHandler));
router.patch('/bookings/:id/cancel', bookingHandler.cancelBooking.bind(bookingHandler));

router.post('/promo-codes/validate', promoCodeHandler.validatePromoCode.bind(promoCodeHandler));
router.get('/promo-codes', promoCodeHandler.getPromoCodes.bind(promoCodeHandler));
router.get('/promo-codes/:id', promoCodeHandler.getPromoCodeById.bind(promoCodeHandler));
router.post('/promo-codes', promoCodeHandler.createPromoCode.bind(promoCodeHandler));
router.patch('/promo-codes/:id', promoCodeHandler.updatePromoCode.bind(promoCodeHandler));
router.delete('/promo-codes/:id', promoCodeHandler.deletePromoCode.bind(promoCodeHandler));

export default router;
