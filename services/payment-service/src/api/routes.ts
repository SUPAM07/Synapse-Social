import { Router } from 'express';
import { paymentHandler } from './handlers/payment.handler';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));
router.get('/payment/:id', paymentHandler.getPayment.bind(paymentHandler));
router.get('/payment/booking/:bookingId', paymentHandler.getPaymentByBooking.bind(paymentHandler));

export default router;
