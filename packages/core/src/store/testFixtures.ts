import type { KlineBar } from "../types/kline";
import { createInitialKeisenState } from "./createKeisenStore";
import type { KeisenState } from "./Store";
import type { ChartDataState } from "../types/kline";

/** 测试用合成 K 线（替代已移除的 example-data/kline.json） */
export const createSampleKline = (length = 200): KlineBar[] =>
  Array.from({ length }, (_, i) => ({
    t: 1_700_000_000_000 + i * 60_000,
    o: 100 + i * 0.1,
    h: 101 + i * 0.1,
    l: 99 + i * 0.1,
    c: 100.5 + i * 0.1,
    v: 1000 + i,
  }));

export const createInitialKeisenStateWithExampleData = (): KeisenState<ChartDataState> =>
  createInitialKeisenState({
    kline: createSampleKline(),
  });
