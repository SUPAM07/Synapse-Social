import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { env } from '../config.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  getEvent,
  searchEvents,
  approveEvent,
  rejectEvent,
  trendingEvents,
  updateEventSeats,
} from '../controllers/eventController.js';

const storage = multer.diskStorage({
  destination: env.uploadsDir,
  filename: (_req, file, cb) => cb(null, `poster-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

const router = Router();

router.get('/trending', trendingEvents);
router.get('/search', searchEvents);
router.get('/', listEvents);
router.get('/:id', getEvent);

router.post('/', authenticate, authorizeRoles('organizer', 'admin'), upload.single('poster'), createEvent);
router.put('/:id', authenticate, authorizeRoles('organizer', 'admin'), upload.single('poster'), updateEvent);
router.delete('/:id', authenticate, authorizeRoles('organizer', 'admin'), deleteEvent);

// Admin approval
router.post('/:id/approve', authenticate, authorizeRoles('admin'), approveEvent);
router.post('/:id/reject', authenticate, authorizeRoles('admin'), rejectEvent);

// Internal: called by Booking Service to adjust seat counts
router.patch('/:id/seats', updateEventSeats);

export default router;
