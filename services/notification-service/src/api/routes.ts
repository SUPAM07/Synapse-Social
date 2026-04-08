import { Router } from 'express';

const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

export default router;
