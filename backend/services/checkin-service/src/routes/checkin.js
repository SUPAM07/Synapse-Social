import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { qrCheckin, manualCheckin, getEventCheckinStats } from '../controllers/checkinController.js';
import { validate } from '../middleware/validate.js';
import { qrCheckinSchema, manualCheckinSchema } from '../validators/index.js';

const router = Router();

router.post('/qr', authenticate, authorizeRoles('organizer', 'admin'), validate(qrCheckinSchema), qrCheckin);
router.post('/manual', authenticate, authorizeRoles('organizer', 'admin'), validate(manualCheckinSchema), manualCheckin);
router.get('/event/:eventId', authenticate, authorizeRoles('organizer', 'admin'), getEventCheckinStats);

export default router;
