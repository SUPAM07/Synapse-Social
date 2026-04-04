import { Router } from 'express';
import { register, login, refresh, logout, verifyToken, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/signup', register);           // alias for backwards compat
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/verify', verifyToken);
router.get('/profile', authenticate, profile);

export default router;
