import { describe, expect, test } from "bun:test";

import {
  computeBOLL,
  computeEMA,
  computeMACD,
  computeSAR,
  computeSMMA,
  computeSMA,
} from "./indicators";
import type { KlineBar } from "../types/kline";

const makeBar = (close: number): KlineBar => ({
  t: 0,
  o: close,
  h: close,
  l: close,
  c: close,
  v: 0,
});

const makeBarHL = (high: number, low: number, close?: number): KlineBar => ({
  t: 0,
  o: close ?? (high + low) / 2,
  h: high,
  l: low,
  c: close ?? (high + low) / 2,
  v: 0,
});

describe("computeSMA", () => {
  test("returns null for first period-1 bars", () => {
    const kline = [1, 2, 3, 4, 5].map(makeBar);
    const sma = computeSMA(kline, 3);

    expect(sma[0]).toBeNull();
    expect(sma[1]).toBeNull();
    expect(sma[2]).toBe(2);
    expect(sma[3]).toBe(3);
    expect(sma[4]).toBe(4);
  });

  test("returns all null when period is 0", () => {
    const kline = [1, 2].map(makeBar);
    expect(computeSMA(kline, 0)).toEqual([null, null]);
  });

  test("period 1 mirrors close prices", () => {
    const kline = [10, 20, 30].map(makeBar);
    expect(computeSMA(kline, 1)).toEqual([10, 20, 30]);
  });
});

describe("computeEMA", () => {
  test("returns null for first period-1 bars", () => {
    const kline = [2, 4, 6, 8, 10].map(makeBar);
    const ema = computeEMA(kline, 3);

    expect(ema[0]).toBeNull();
    expect(ema[1]).toBeNull();
    expect(ema[2]).toBe(4);
  });

  test("returns all null when period is 0", () => {
    const kline = [1, 2].map(makeBar);
    expect(computeEMA(kline, 0)).toEqual([null, null]);
  });

  test("computes recursive EMA after SMA seed", () => {
    const kline = [2, 4, 6, 8, 10].map(makeBar);
    const ema = computeEMA(kline, 3);
    const multiplier = 2 / (3 + 1);

    expect(ema[3]).toBeCloseTo((8 - 4) * multiplier + 4);
    expect(ema[4]).toBeCloseTo((10 - ema[3]!) * multiplier + ema[3]!);
  });
});

describe("computeSMMA", () => {
  test("returns null for first period-1 bars", () => {
    const kline = [2, 4, 6, 8, 10].map(makeBar);
    const smma = computeSMMA(kline, 3);

    expect(smma[0]).toBeNull();
    expect(smma[1]).toBeNull();
    expect(smma[2]).toBe(4);
  });

  test("returns all null when period is 0", () => {
    const kline = [1, 2].map(makeBar);
    expect(computeSMMA(kline, 0)).toEqual([null, null]);
  });

  test("computes recursive SMMA after SMA seed", () => {
    const kline = [2, 4, 6, 8, 10].map(makeBar);
    const smma = computeSMMA(kline, 3);

    expect(smma[3]).toBeCloseTo((4 * 2 + 8) / 3);
    expect(smma[4]).toBeCloseTo((smma[3]! * 2 + 10) / 3);
  });
});

describe("computeBOLL", () => {
  test("returns null until period is satisfied", () => {
    const kline = [1, 2, 3, 4, 5].map(makeBar);
    const boll = computeBOLL(kline, 3, 2);

    expect(boll.middle[0]).toBeNull();
    expect(boll.middle[1]).toBeNull();
    expect(boll.upper[0]).toBeNull();
    expect(boll.lower[0]).toBeNull();
  });

  test("computes middle upper and lower bands", () => {
    const kline = [2, 4, 6].map(makeBar);
    const boll = computeBOLL(kline, 3, 2);

    const mean = 4;
    const variance = ((2 - 4) ** 2 + (4 - 4) ** 2 + (6 - 4) ** 2) / 3;
    const std = Math.sqrt(variance);

    expect(boll.middle[2]).toBe(mean);
    expect(boll.upper[2]).toBeCloseTo(mean + 2 * std);
    expect(boll.lower[2]).toBeCloseTo(mean - 2 * std);
  });

  test("returns all null when period is 0", () => {
    const kline = [1, 2].map(makeBar);
    const boll = computeBOLL(kline, 0, 2);
    expect(boll.middle).toEqual([null, null]);
    expect(boll.upper).toEqual([null, null]);
    expect(boll.lower).toEqual([null, null]);
  });
});

describe("computeSAR", () => {
  test("returns null for first bar and starts from second", () => {
    const kline = [
      makeBarHL(10, 8),
      makeBarHL(12, 9),
      makeBarHL(13, 10),
    ];
    const sar = computeSAR(kline, 2, 2, 20);

    expect(sar[0]).toBeNull();
    expect(sar[1]).toBe(8);
    expect(sar[2]).not.toBeNull();
  });

  test("returns all null when fewer than 2 bars", () => {
    const kline = [makeBarHL(10, 8)];
    expect(computeSAR(kline)).toEqual([null]);
  });

  test("reverses trend when price crosses SAR", () => {
    const kline = [
      makeBarHL(10, 8, 9),
      makeBarHL(12, 9, 11),
      makeBarHL(13, 10, 12),
      makeBarHL(11, 7, 8),
      makeBarHL(9, 6, 7),
    ];
    const sar = computeSAR(kline, 2, 2, 20);

    expect(sar[3]).not.toBeNull();
    expect(sar[4]).not.toBeNull();
    expect(sar[4]!).toBeGreaterThan(kline[4]!.h);
  });
});

describe("computeMACD", () => {
  test("returns null points when period is invalid", () => {
    const kline = [1, 2, 3].map(makeBar);
    expect(computeMACD(kline, 0, 26, 9)).toEqual([
      { dif: null, dea: null, macd: null },
      { dif: null, dea: null, macd: null },
      { dif: null, dea: null, macd: null },
    ]);
  });

  test("returns null while EMA windows are incomplete", () => {
    const kline = Array.from({ length: 10 }, (_, i) => makeBar(i + 1));
    const macd = computeMACD(kline, 3, 5, 3);

    expect(macd[0]).toEqual({ dif: null, dea: null, macd: null });
    expect(macd[3]).toEqual({ dif: null, dea: null, macd: null });
    expect(macd[4]!.dif).not.toBeNull();
  });

  test("computes DIF as fast EMA minus slow EMA", () => {
    const kline = Array.from({ length: 40 }, (_, i) => makeBar(i + 1));
    const macd = computeMACD(kline, 3, 5, 3);
    const fast = computeEMA(kline, 3);
    const slow = computeEMA(kline, 5);

    for (let i = 0; i < kline.length; i++) {
      if (fast[i] === null || slow[i] === null) {
        expect(macd[i]!.dif).toBeNull();
      } else {
        expect(macd[i]!.dif).toBeCloseTo(fast[i]! - slow[i]!);
      }
    }
  });

  test("macd histogram is 2 * (dif - dea) when both ready", () => {
    const kline = Array.from({ length: 40 }, (_, i) => makeBar(i + 1));
    const macd = computeMACD(kline, 3, 5, 3);
    const ready = macd.find((p) => p.dif !== null && p.dea !== null);
    expect(ready).toBeDefined();
    expect(ready!.macd).toBeCloseTo(2 * (ready!.dif! - ready!.dea!));
  });
});
