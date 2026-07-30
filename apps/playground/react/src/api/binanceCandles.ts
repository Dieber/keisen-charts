import type { GetDataFn, KlineBar } from "@keisen-charts/react";
import { resolutionToSeconds } from "@keisen-charts/react";

import { getDynamicLimit, resolutionToBinanceInterval } from "./resolution";

const DEFAULT_COUNT_BACK = 100;
const MAX_LIMIT = 1000;

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  ...unknown[],
];

const normalizeBinanceBars = (rows: BinanceKline[]): KlineBar[] =>
  rows
    .map((row) => ({
      t: row[0],
      o: +row[1],
      h: +row[2],
      l: +row[3],
      c: +row[4],
      v: +row[5],
    }))
    .filter((bar) => Number.isFinite(bar.t))
    .sort((a, b) => a.t - b.t);

const buildKlinesUrl = (params: {
  symbol: string;
  interval: string;
  limit: number;
  endTime: number;
  startTime?: number;
}): string => {
  const search = new URLSearchParams({
    symbol: params.symbol.toUpperCase(),
    interval: params.interval,
    limit: String(params.limit),
    endTime: String(params.endTime),
  });
  if (params.startTime != null) {
    search.set("startTime", String(params.startTime));
  }
  return `/api/binance/v3/klines?${search.toString()}`;
};

export const binanceGetData: GetDataFn = async ({
  resolution,
  symbol,
  from,
  to,
  countBack,
}) => {
  if (!symbol) {
    throw new Error("Binance klines request requires a symbol");
  }

  const toMs = to ?? Date.now();
  const intervalMs = resolutionToSeconds(resolution) * 1000;
  const resolvedCountBack = countBack ?? DEFAULT_COUNT_BACK;
  const fromMs = from ?? toMs - resolvedCountBack * intervalMs;

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      resolvedCountBack,
      getDynamicLimit(
        resolution,
        Math.floor(fromMs / 1000),
        Math.floor(toMs / 1000),
      ),
    ),
  );

  const url = buildKlinesUrl({
    symbol,
    interval: resolutionToBinanceInterval(resolution),
    limit,
    endTime: toMs,
    startTime: from != null ? fromMs : undefined,
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance klines request failed: ${response.status}`);
  }

  const rows = (await response.json()) as BinanceKline[];
  return normalizeBinanceBars(rows);
};
