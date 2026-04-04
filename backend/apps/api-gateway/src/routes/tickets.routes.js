const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();
const TICKETS_SERVICE_URL = process.env.TICKETS_SERVICE_URL || 'http://localhost:3003';

const proxy = createProxyMiddleware({
  target: TICKETS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/tickets': '/tickets' },
  on: {
    error: (err, req, res) => {
      console.error('Tickets proxy error:', err.message);
      res.status(502).json({ status: 'error', message: 'Tickets service unavailable' });
    },
  },
});

router.use('/', authenticateToken, proxy);

module.exports = router;
