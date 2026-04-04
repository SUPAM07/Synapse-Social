import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview,
  getEventStats,
} from '../controllers/reviewController.js';

const router = Router();

router.post('/event/:eventId', authenticate, createReview);
router.get('/event/:eventId', getEventReviews);
router.get('/stats/event/:eventId', getEventStats);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
