const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

const router = Router();
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://localhost:3002';

const proxy = createProxyMiddleware({
  target: EVENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/events': '/events' },
  on: {
    error: (err, req, res) => {
      console.error('Events proxy error:', err.message);
      res.status(502).json({ status: 'error', message: 'Events service unavailable' });
    },
  },
});

// Public routes (no auth needed)
router.get('/', proxy);
router.get('/:id', proxy);
router.get('/slug/:slug', proxy);
router.get('/search', proxy);

// Protected routes
router.post('/', authenticateToken, proxy);
router.put('/:id', authenticateToken, proxy);
router.delete('/:id', authenticateToken, proxy);
router.patch('/:id/publish', authenticateToken, proxy);

module.exports = router;
