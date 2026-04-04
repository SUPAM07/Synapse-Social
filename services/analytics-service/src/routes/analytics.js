import { Router } from 'express';
import { getOverview, getTopEvents, getRecentActivity } from '../controllers/analyticsController.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/top-events', getTopEvents);
router.get('/activity', getRecentActivity);

export default router;
