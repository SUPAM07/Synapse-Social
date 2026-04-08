import { Router } from 'express';
import { bookingHandler } from './handlers/booking.handler';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'booking-service' }));
router.get('/bookings', bookingHandler.getBookings.bind(bookingHandler));
router.get('/bookings/:id', bookingHandler.getBooking.bind(bookingHandler));
router.post('/bookings', bookingHandler.createBooking.bind(bookingHandler));
router.patch('/bookings/:id/cancel', bookingHandler.cancelBooking.bind(bookingHandler));

export default router;
