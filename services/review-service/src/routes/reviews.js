import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview,
  getEventStats,
} from '../controllers/reviewController.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema, updateReviewSchema } from '../validators/index.js';

const router = Router();

router.post('/event/:eventId', authenticate, validate(createReviewSchema), createReview);
router.get('/event/:eventId', getEventReviews);
router.get('/stats/event/:eventId', getEventStats);
router.put('/:id', authenticate, validate(updateReviewSchema), updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
