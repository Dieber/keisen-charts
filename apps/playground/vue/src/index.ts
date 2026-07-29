import { serve, type Server } from "bun";
import index from "./index.html";

const KTX_API_ORIGIN = "https://api.ktx.com";

const STRIP_RESPONSE_HEADERS = [
  "content-encoding",
  "content-length",
  "transfer-encoding",
] as const;

/** 开发态把 `/api/ktx/*` 代理到 KTX REST，避免浏览器直连跨域 */
async function proxyKtxApi(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.slice("/api/ktx".length);
  const targetUrl = `${KTX_API_ORIGIN}/api${path}${url.search}`;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      accept: req.headers.get("accept") ?? "application/json",
    },
    body:
      req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
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

// bun --hot 会重跑本模块；先停掉上一轮 server，否则同端口 EADDRINUSE
const previous = import.meta.hot?.data.server as Server | undefined;
previous?.stop(true);

const server = serve({
  port: Number(process.env.PORT) || 3001,
  routes: {
    "/api/ktx/*": proxyKtxApi,
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

if (import.meta.hot) {
  import.meta.hot.data.server = server;
}

console.log(`🚀 Vue playground running at ${server.url}`);
