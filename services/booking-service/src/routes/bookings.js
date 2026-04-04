import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  getQrCode,
} from '../controllers/bookingController.js';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/:id', authenticate, getBooking);
router.get('/user/:userId', authenticate, getUserBookings);
router.put('/:id/cancel', authenticate, cancelBooking);
router.get('/:id/qr', authenticate, getQrCode);

export default router;
