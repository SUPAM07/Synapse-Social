const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const proxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  on: {
    error: (err, req, res) => {
      console.error('Auth proxy error:', err.message);
      res.status(502).json({ status: 'error', message: 'Auth service unavailable' });
    },
  },
});

router.use('/', proxy);

module.exports = router;
