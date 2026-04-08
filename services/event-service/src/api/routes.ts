import { Router } from 'express';
import { eventHandler } from './handlers/event.handler';
import { formatHandler } from './handlers/format.handler';
import { themeHandler } from './handlers/theme.handler';
import { commentHandler } from './handlers/comment.handler';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'event-service' }));

router.get('/events', eventHandler.getEvents.bind(eventHandler));
router.get('/events/:id', eventHandler.getEvent.bind(eventHandler));
router.post('/events', eventHandler.createEvent.bind(eventHandler));
router.patch('/events/:id', eventHandler.updateEvent.bind(eventHandler));
router.delete('/events/:id', eventHandler.deleteEvent.bind(eventHandler));

router.get('/formats', formatHandler.getFormats.bind(formatHandler));
router.post('/formats', formatHandler.createFormat.bind(formatHandler));
router.delete('/formats/:id', formatHandler.deleteFormat.bind(formatHandler));

router.get('/themes', themeHandler.getThemes.bind(themeHandler));
router.post('/themes', themeHandler.createTheme.bind(themeHandler));
router.delete('/themes/:id', themeHandler.deleteTheme.bind(themeHandler));

router.get('/events/:eventId/comments', commentHandler.getComments.bind(commentHandler));
router.post('/events/:eventId/comments', commentHandler.createComment.bind(commentHandler));
router.delete('/comments/:id', commentHandler.deleteComment.bind(commentHandler));

export default router;
