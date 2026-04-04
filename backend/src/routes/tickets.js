import { Router } from 'express';
import * as ticketsController from '../controllers/ticketsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { purchaseTicketSchema } from '../utils/validation.js';

const router = Router();

router.get('/', verifyToken, ticketsController.getUserTickets);
router.get('/:id', verifyToken, ticketsController.getTicket);
router.post('/event/:eventId', verifyToken, validate(purchaseTicketSchema), ticketsController.purchaseTicket);
router.patch('/:id/cancel', verifyToken, ticketsController.cancelTicket);
router.patch('/:qrCode/checkin', verifyToken, ticketsController.checkInAttendee);

export default router;
