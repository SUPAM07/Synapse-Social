import { Router } from 'express';
import authRoutes from './auth.js';
import eventsRoutes from './events.js';
import ticketsRoutes from './tickets.js';
import usersRoutes from './users.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date() });
});

router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/users', usersRoutes);

export default router;
