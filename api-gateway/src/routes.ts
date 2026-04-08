import { Router, Request, Response } from 'express';
import { config } from './config';
import { createServiceProxy } from './proxy';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      auth: config.services.auth,
      user: config.services.user,
      event: config.services.event,
      booking: config.services.booking,
      payment: config.services.payment,
      notification: config.services.notification,
    },
  });
});

router.use('/auth', createServiceProxy(config.services.auth));
router.use('/users', createServiceProxy(config.services.user));
router.use('/me/profile', createServiceProxy(config.services.user));
router.use('/companies', createServiceProxy(config.services.user));
router.use('/events', createServiceProxy(config.services.event));
router.use('/formats', createServiceProxy(config.services.event));
router.use('/themes', createServiceProxy(config.services.event));
router.use('/comments', createServiceProxy(config.services.event));
router.use('/bookings', createServiceProxy(config.services.booking));
router.use('/promo-codes', createServiceProxy(config.services.booking));
router.use('/payment', createServiceProxy(config.services.payment));
router.use('/notifications', createServiceProxy(config.services.notification));

export default router;
