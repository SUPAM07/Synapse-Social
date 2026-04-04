import { Router } from 'express';
import * as usersController from '../controllers/usersController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/:id', verifyToken, usersController.getUser);
router.put('/:id', verifyToken, usersController.updateUser);
router.get('/:id/events', usersController.getUserEvents);
router.get('/:id/tickets', verifyToken, usersController.getUserTickets);

export default router;
