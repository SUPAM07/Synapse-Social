import { Router } from 'express';
import * as eventsController from '../controllers/eventsController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createEventSchema, updateEventSchema } from '../utils/validation.js';

const router = Router();

router.get('/', eventsController.getEvents);
router.get('/me', verifyToken, eventsController.getMyEvents);
router.get('/slug/:slug', eventsController.getEventBySlug);
router.get('/:id', eventsController.getEvent);
router.post('/', verifyToken, validate(createEventSchema), eventsController.createEvent);
router.put('/:id', verifyToken, validate(updateEventSchema), eventsController.updateEvent);
router.delete('/:id', verifyToken, eventsController.deleteEvent);
router.get('/:id/attendees', verifyToken, eventsController.getEventAttendees);

export default router;
