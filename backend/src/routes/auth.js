import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validation.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getMe);
router.post('/refresh-token', authController.refreshToken);
router.patch('/profile', verifyToken, validate(updateProfileSchema), authController.updateProfile);

export default router;
