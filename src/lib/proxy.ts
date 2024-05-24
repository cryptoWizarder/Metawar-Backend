import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const router = Router();

const options: Options = {
  target: 'https://image-resizer-cache.immutable.com',
  changeOrigin: true,
  pathRewrite: {
    ['^/resizer']: '',
  },
  onProxyReq(proxyReq) {
    proxyReq.setHeader('Referer', 'https://market.immutable.com');
  },
  onProxyRes(proxyRes, req, res) {
    res.removeHeader('Access-Control-Allow-Origin');
    res.removeHeader('Access-Control-Allow-Credentials');
    res.removeHeader('Access-Control-Allow-Methods');
    res.removeHeader('Access-Control-Allow-Headers');
    res.setHeader('Surrogate-Control', 'public, max-age=86400');
  },
};

router.use('/resizer', createProxyMiddleware(options));

export default router;
