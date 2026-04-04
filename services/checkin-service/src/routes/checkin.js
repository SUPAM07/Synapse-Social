import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { qrCheckin, manualCheckin, getEventCheckinStats } from '../controllers/checkinController.js';

const router = Router();

router.post('/qr', authenticate, authorizeRoles('organizer', 'admin'), qrCheckin);
router.post('/manual', authenticate, authorizeRoles('organizer', 'admin'), manualCheckin);
router.get('/event/:eventId', authenticate, authorizeRoles('organizer', 'admin'), getEventCheckinStats);

export default router;
