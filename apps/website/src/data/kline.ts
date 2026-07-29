import btc1m from "./btcusdt-1m.json";
import btc5m from "./btcusdt-5m.json";
import btc15m from "./btcusdt-15m.json";
import btc1h from "./btcusdt-1h.json";
import btc1d from "./btcusdt-1d.json";
import eth1m from "./ethusdt-1m.json";
import eth5m from "./ethusdt-5m.json";
import eth15m from "./ethusdt-15m.json";
import eth1h from "./ethusdt-1h.json";
import eth1d from "./ethusdt-1d.json";

export type DocKlineBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

/** symbol × interval → KlineBar[]（文档离线快照） */
export const KLINE_SNAPSHOTS: Record<string, DocKlineBar[]> = {
  "BTCUSDT:1m": btc1m as DocKlineBar[],
  "BTCUSDT:5m": btc5m as DocKlineBar[],
  "BTCUSDT:15m": btc15m as DocKlineBar[],
  "BTCUSDT:1h": btc1h as DocKlineBar[],
  "BTCUSDT:1d": btc1d as DocKlineBar[],
  "ETHUSDT:1m": eth1m as DocKlineBar[],
  "ETHUSDT:5m": eth5m as DocKlineBar[],
  "ETHUSDT:15m": eth15m as DocKlineBar[],
  "ETHUSDT:1h": eth1h as DocKlineBar[],
  "ETHUSDT:1d": eth1d as DocKlineBar[],
};

/** 默认 BTC 1m，兼容旧示例 */
export const BTC_KLINES = KLINE_SNAPSHOTS["BTCUSDT:1m"]!;

/** Sandpack 注入路径（React 模板根路径） */
export const KLINE_PATH = "/kline.ts";
export const KLINE_PATH_VUE = "/src/kline.ts";

/**
 * 可注入 Sandpack：按 symbol / resolution 取预加载快照；onSubscribe 本地 mock 推送。
 */
export const KLINE_MODULE = `export type KlineBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

const SNAPSHOTS: Record<string, KlineBar[]> = ${JSON.stringify(KLINE_SNAPSHOTS)};

function normalizeSymbol(symbol?: string): string {
  const s = (symbol ?? "BTCUSDT").toUpperCase();
  if (s === "ETH" || s.startsWith("ETH")) return "ETHUSDT";
  return "BTCUSDT";
}

function resolutionToInterval(resolution?: string): string {
  const r = resolution ?? "1";
  if (r === "1D" || r === "1d") return "1d";
  if (r === "1W" || r === "1w") return "1d";
  if (r === "1M") return "1d";
  const minutes = Number(r);
  if (minutes >= 60 && minutes % 60 === 0) return \`\${minutes / 60}h\`;
  if (Number.isFinite(minutes) && minutes > 0) return \`\${minutes}m\`;
  return "1m";
}

function snapshotKey(symbol?: string, resolution?: string): string {
  return \`\${normalizeSymbol(symbol)}:\${resolutionToInterval(resolution)}\`;
}

function stepMs(resolution?: string): number {
  const r = resolution ?? "1";
  if (r === "1D" || r === "1d") return 86_400_000;
  const minutes = Number(r);
  if (Number.isFinite(minutes) && minutes > 0) return minutes * 60_000;
  return 60_000;
}

export function getBars(symbol?: string, resolution?: string): KlineBar[] {
  const key = snapshotKey(symbol, resolution);
  const bars = SNAPSHOTS[key] ?? SNAPSHOTS["BTCUSDT:1m"]!;
  return bars.map((b) => ({ ...b }));
}

/** 默认 BTC 1m */
export const BTC_KLINES = getBars("BTCUSDT", "1");

export async function getKlineData(params: {
  symbol?: string;
  resolution?: string;
}): Promise<KlineBar[]> {
  return getBars(params.symbol, params.resolution);
}

/** @deprecated 用 getKlineData */
export async function getBtcData(params: {
  symbol?: string;
  resolution?: string;
} = {}): Promise<KlineBar[]> {
  return getKlineData({ symbol: params.symbol ?? "BTCUSDT", resolution: params.resolution ?? "1" });
}

export function subscribeKline(
  params: { symbol?: string; resolution?: string },
  emit: {
    bar: (bar: KlineBar) => void;
  },
) {
  const bars = getBars(params.symbol, params.resolution);
  let last: KlineBar = { ...bars[bars.length - 1]! };
  const step = stepMs(params.resolution);
  const scale = normalizeSymbol(params.symbol) === "ETHUSDT" ? 0.8 : 12;
  let tick = 0;
  const id = window.setInterval(() => {
    const jitter = (Math.random() - 0.5) * scale;
    if (tick > 0 && tick % 5 === 0) {
      last = {
        t: last.t + step,
        o: last.c,
        h: Math.max(last.c, last.c + jitter),
        l: Math.min(last.c, last.c + jitter),
        c: last.c + jitter,
        v: Math.max(0.01, last.v * (0.6 + Math.random() * 0.8)),
      };
    } else {
      const c = last.c + jitter;
      last = {
        ...last,
        c,
        h: Math.max(last.h, c, last.o),
        l: Math.min(last.l, c, last.o),
        v: last.v + Math.random() * 0.5,
      };
    }
    emit.bar({ ...last });
    tick += 1;
  }, 900);
  return () => window.clearInterval(id);
}

/** @deprecated 用 subscribeKline */
export const subscribeBtc = subscribeKline;
`;

/** React：App 在前，kline 在后 */
export function reactKlineFiles(appSource: string): Record<string, string> {
  return {
    "/App.tsx": appSource,
    [KLINE_PATH]: KLINE_MODULE,
  };
}

/** Vue：App 在前，kline 在后 */
export function vueKlineFiles(appSource: string): Record<string, string> {
  return {
    "/src/App.vue": appSource,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  };
}
