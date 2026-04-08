import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authHandler } from './handlers/auth.handler';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  sendPasswordResetSchema,
} from './middleware/validate';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many auth attempts, please try again later.' },
});

const strictAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many attempts, please try again in an hour.' },
});

router.post('/register', authRateLimit, validate(registerSchema), authHandler.register.bind(authHandler));
router.get('/confirm-email', authHandler.confirmEmail.bind(authHandler));
router.post('/login', strictAuthRateLimit, validate(loginSchema), authHandler.login.bind(authHandler));
router.post('/refresh', authRateLimit, validate(refreshSchema), authHandler.refresh.bind(authHandler));
router.post('/logout', authRateLimit, authHandler.logout.bind(authHandler));
router.post('/password-reset/send', strictAuthRateLimit, validate(sendPasswordResetSchema), authHandler.sendPasswordReset.bind(authHandler));
router.post('/password-reset/reset', strictAuthRateLimit, validate(resetPasswordSchema), authHandler.resetPassword.bind(authHandler));

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

export default router;
