import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config.js';
import logger from '../middleware/logger.js';

function proxy(target, pathRewrite = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, _req, res) => {
        logger.error(`Proxy error → ${target}: ${err.message}`);
        if (res.headersSent) return;
        res.status(502).json({ success: false, message: 'Service temporarily unavailable' });
      },
    },
  });
}

export const authProxy = proxy(env.authServiceUrl);
export const eventProxy = proxy(env.eventServiceUrl);
export const bookingProxy = proxy(env.bookingServiceUrl);
export const reviewProxy = proxy(env.reviewServiceUrl);
export const checkinProxy = proxy(env.checkinServiceUrl);
export const notificationProxy = proxy(env.notificationServiceUrl);
export const analyticsProxy = proxy(env.analyticsServiceUrl);
