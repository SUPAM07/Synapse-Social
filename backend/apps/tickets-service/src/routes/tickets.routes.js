const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('@ai-event-organiser/common');
const { authenticateToken } = require('../middleware/auth.middleware');
const { purchaseTicket, cancelTicket, getMyTickets, getEventTickets, checkIn } = require('../controllers/tickets.controller');

const router = Router();

router.get('/me', authenticateToken, getMyTickets);
router.get('/event/:eventId', authenticateToken, getEventTickets);
router.patch('/checkin/:qrCode', authenticateToken, checkIn);

router.post('/event/:eventId',
  authenticateToken,
  [
    body('attendeeName').notEmpty().withMessage('Attendee name is required'),
    body('attendeeEmail').isEmail().withMessage('Valid attendee email is required'),
    validate,
  ],
  purchaseTicket
);

router.patch('/:id/cancel', authenticateToken, cancelTicket);

module.exports = router;
