/**
 * Fetch Binance klines for docs (BTC/ETH × multiple intervals).
 *
 * Usage: bun scripts/fetch-doc-klines.ts
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const SYMBOLS = ["BTCUSDT", "ETHUSDT"] as const;
const INTERVALS = ["1m", "5m", "15m", "1h", "1d"] as const;
const LIMIT = 100;

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  ...unknown[],
];

type KlineBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

const root = join(import.meta.dir, "..");
const outDir = join(root, "apps/website/src/data");

await mkdir(outDir, { recursive: true });

for (const symbol of SYMBOLS) {
  for (const interval of INTERVALS) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${LIMIT}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Binance klines failed (${symbol} ${interval}): ${res.status} ${res.statusText}`,
      );
    }
    const raw = (await res.json()) as BinanceKline[];
    const bars: KlineBar[] = raw.map((row) => ({
      t: row[0],
      o: +row[1],
      h: +row[2],
      l: +row[3],
      c: +row[4],
      v: +row[5],
    }));
    const outFile = join(outDir, `${symbol.toLowerCase()}-${interval}.json`);
    await Bun.write(outFile, `${JSON.stringify(bars, null, 2)}\n`);
    console.log(`Wrote ${bars.length} bars → ${outFile}`);
  }
}
