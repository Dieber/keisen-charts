import { serve, type Server } from 'bun';
import index from './index.html';

const KTX_API_ORIGIN = 'https://api.ktx.com';
// const KTX_API_ORIGIN = 'https://tapi.ktx.one';

const STRIP_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
] as const;

/** 开发态把 `/api/ktx/*` 代理到 KTX REST，避免浏览器直连跨域 */
async function proxyKtxApi(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.slice('/api/ktx'.length);
  const targetUrl = `${KTX_API_ORIGIN}/api${path}${url.search}`;

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
    '/api/ktx/*': proxyKtxApi,
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
