import { Router } from 'express';
import { register, login, refresh, logout, verifyToken, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/index.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/signup', validate(registerSchema), register); // alias for backwards compat
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/verify', verifyToken);
router.get('/profile', authenticate, profile);

export default router;
