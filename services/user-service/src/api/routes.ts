import { Router } from 'express';
import { userHandler } from './handlers/user.handler';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }));

router.get('/me/profile', userHandler.getMe.bind(userHandler));
router.get('/users/:id', userHandler.getUser.bind(userHandler));
router.patch('/users/:id', userHandler.updateUser.bind(userHandler));
router.delete('/users/:id', userHandler.deleteUser.bind(userHandler));

router.get('/users/:id/companies', userHandler.getUserCompanies.bind(userHandler));
router.post('/companies', userHandler.createCompany.bind(userHandler));
router.patch('/companies/:companyId', userHandler.updateCompany.bind(userHandler));
router.delete('/companies/:companyId', userHandler.deleteCompany.bind(userHandler));

router.get('/me/subscriptions', userHandler.getSubscriptions.bind(userHandler));
router.post('/companies/:companyId/subscribe', userHandler.subscribe.bind(userHandler));
router.delete('/companies/:companyId/subscribe', userHandler.unsubscribe.bind(userHandler));

export default router;
