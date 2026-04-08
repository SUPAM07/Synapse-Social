import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

export const createServiceProxy = (target: string, pathRewrite?: Record<string, string>): RequestHandler => {
  const options: Options = {
    target,
    changeOrigin: true,
    on: {
      error: (err, _req, res: any) => {
        res.status(502).json({ error: 'Service unavailable', message: (err as Error).message });
      },
    },
  };

  if (pathRewrite) {
    options.pathRewrite = pathRewrite;
  }

  return createProxyMiddleware(options) as unknown as RequestHandler;
};
