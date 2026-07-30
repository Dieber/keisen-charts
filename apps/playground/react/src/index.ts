import { serve } from 'bun';
import index from './index.html';

const BINANCE_API_ORIGIN = 'https://api.binance.com';

const STRIP_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
] as const;

/** 开发态把 `/api/binance/*` 代理到 Binance REST，避免浏览器直连跨域 */
async function proxyBinanceApi(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.slice('/api/binance'.length);
  const targetUrl = `${BINANCE_API_ORIGIN}/api${path}${url.search}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
    body:
      req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const headers = new Headers(response.headers);
  for (const name of STRIP_RESPONSE_HEADERS) {
    headers.delete(name);
  }

  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const server = serve({
  routes: {
    '/api/binance/*': proxyBinanceApi,
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

if (import.meta.hot) {
  import.meta.hot.data.server = server;
}

console.log(`🚀 Server running at ${server.url}`);
