import type { GetDataFn, KlineBar } from "@keisen-charts/react";
import { resolutionToSeconds } from "@keisen-charts/react";

import { getDynamicLimit, resolutionToKtxTimeFrame } from "./resolution";

const MARKET = "lpc";
const DEFAULT_COUNT_BACK = 100;

type KtxCandlesResponse = {
  result?: {
    e?: unknown[][];
  };
  state?: number;
};

const normalizeKtxBars = (rows: unknown[][]): KlineBar[] =>
  rows
    .map((row) => ({
      t: Number(row[0]),
      o: Number(row[1]),
      h: Number(row[2]),
      l: Number(row[3]),
      c: Number(row[4]),
      v: Number(row[5]),
    }))
    .filter((bar) => Number.isFinite(bar.t))
    .sort((a, b) => a.t - b.t);

const buildCandlesUrl = (params: {
  symbol: string;
  time_frame: string;
  limit: number;
  before: number;
}): string => {
  const search = new URLSearchParams({
    market: MARKET,
    symbol: params.symbol,
    time_frame: params.time_frame,
    limit: String(params.limit),
    before: String(params.before),
    origin: "1",
  });
  return `/api/ktx/v1/candles?${search.toString()}`;
};

export const ktxGetData: GetDataFn = async ({
  resolution,
  symbol,
  from,
  to,
  countBack,
}) => {
  if (!symbol) {
    throw new Error("KTX candles request requires a symbol");
  }

  const toMs = to ?? Date.now();
  const intervalMs = resolutionToSeconds(resolution) * 1000;
  const resolvedCountBack = countBack ?? DEFAULT_COUNT_BACK;
  const fromMs = from ?? toMs - resolvedCountBack * intervalMs;

  const limit = Math.max(
    resolvedCountBack,
    getDynamicLimit(
      resolution,
      Math.floor(fromMs / 1000),
      Math.floor(toMs / 1000),
    ),
  );

  const url = buildCandlesUrl({
    symbol,
    time_frame: resolutionToKtxTimeFrame(resolution),
    limit,
    before: toMs,
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`KTX candles request failed: ${response.status}`);
  }

  const payload = (await response.json()) as KtxCandlesResponse;
  const rows = payload.result?.e ?? [];
  return normalizeKtxBars(rows);
};
