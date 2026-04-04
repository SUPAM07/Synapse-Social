const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('@ai-event-organiser/common');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  listEvents, getEvent, getEventBySlug, createEvent, updateEvent,
  deleteEvent, togglePublish, getMyEvents,
} = require('../controllers/events.controller');

const router = Router();

router.get('/', listEvents);
router.get('/me', authenticateToken, getMyEvents);
router.get('/slug/:slug', getEventBySlug);
router.get('/:id', getEvent);

router.post('/',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('timezone').notEmpty().withMessage('Timezone is required'),
    body('locationType').isIn(['physical', 'online']).withMessage('Location type must be physical or online'),
    body('city').notEmpty().withMessage('City is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('ticketType').isIn(['free', 'paid']).withMessage('Ticket type must be free or paid'),
    validate,
  ],
  createEvent
);

router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);
router.patch('/:id/publish', authenticateToken, togglePublish);

module.exports = router;
