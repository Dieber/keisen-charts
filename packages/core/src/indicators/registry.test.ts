import { describe, expect, test } from "bun:test";

import {
  clearIndicatorRegistry,
  computeAutoIndicatorDomain,
  computeCCI,
  computeKDJ,
  computeMACDColumns,
  computeMTM,
  computeOBV,
  computeRSI,
  computeWR,
  getIndicator,
  registerBuiltinIndicators,
  registerIndicator,
} from "../index";
import type { KlineBar } from "../types/kline";

const makeBar = (close: number, volume = 100): KlineBar => ({
  t: 0,
  o: close,
  h: close + 1,
  l: close - 1,
  c: close,
  v: volume,
});

describe("computeRSI", () => {
  test("returns null until period is ready", () => {
    const kline = Array.from({ length: 20 }, (_, i) => makeBar(100 + i));
    const rsi = computeRSI(kline, 14);
    expect(rsi[13]).toBeNull();
    expect(rsi[14]).not.toBeNull();
  });

  test("returns all null when period is 0", () => {
    expect(computeRSI([makeBar(1), makeBar(2)], 0)).toEqual([null, null]);
  });
});

describe("computeKDJ", () => {
  test("produces k/d/j after period", () => {
    const kline = Array.from({ length: 20 }, (_, i) => makeBar(50 + i));
    const { k, d, j } = computeKDJ(kline, 9, 3, 3);
    expect(k[8]).not.toBeNull();
    expect(d[8]).not.toBeNull();
    expect(j[8]).not.toBeNull();
  });
});

describe("computeOBV", () => {
  test("starts at 0 and accumulates", () => {
    const kline = [makeBar(10, 100), makeBar(11, 50), makeBar(10, 30)];
    const obv = computeOBV(kline);
    expect(obv[0]).toBe(0);
    expect(obv[1]).toBe(50);
    expect(obv[2]).toBe(20);
  });
});

describe("computeCCI / WR / MTM", () => {
  test("CCI returns null until period", () => {
    const kline = Array.from({ length: 20 }, (_, i) => makeBar(100 + i));
    const cci = computeCCI(kline, 14);
    expect(cci[12]).toBeNull();
    expect(cci[13]).not.toBeNull();
  });

  test("WR returns null until period", () => {
    const kline = Array.from({ length: 20 }, (_, i) => makeBar(100 + i));
    const wr = computeWR(kline, 14);
    expect(wr[12]).toBeNull();
    expect(wr[13]).not.toBeNull();
  });

  test("MTM has mamtm after n+m", () => {
    const kline = Array.from({ length: 30 }, (_, i) => makeBar(100 + i));
    const { mtm, mamtm } = computeMTM(kline, 12, 6);
    expect(mtm[12]).not.toBeNull();
    expect(mamtm[17]).not.toBeNull();
  });
});

describe("computeMACDColumns", () => {
  test("returns columnar arrays aligned with points", () => {
    const kline = Array.from({ length: 50 }, (_, i) => makeBar(100 + (i % 5)));
    const cols = computeMACDColumns(kline);
    expect(cols.dif.length).toBe(50);
    expect(cols.dea.length).toBe(50);
    expect(cols.macd.length).toBe(50);
  });
});

describe("computeAutoIndicatorDomain", () => {
  test("includes zero when requested", () => {
    const domain = computeAutoIndicatorDomain([1, 2, 3], {
      includeZero: true,
      paddingRatio: 0,
    });
    expect(domain.min).toBe(0);
    expect(domain.max).toBe(3);
  });

  test("respects fixed domain", () => {
    expect(
      computeAutoIndicatorDomain([1, 2], { fixed: { min: 0, max: 100 } }),
    ).toEqual({ min: 0, max: 100 });
  });
});

describe("indicator registry", () => {
  test("registerBuiltinIndicators exposes MACD", () => {
    clearIndicatorRegistry();
    registerBuiltinIndicators();
    const macd = getIndicator("MACD");
    expect(macd?.name).toBe("MACD");
    expect(macd?.figures.length).toBe(3);
  });

  test("registerBuiltinIndicators exposes VOLUME", () => {
    clearIndicatorRegistry();
    registerBuiltinIndicators();
    const volume = getIndicator("VOLUME");
    expect(volume?.name).toBe("VOLUME");
    expect(volume?.yDomainPolicy).toBe("fromZero");
    expect(volume?.figures[0]?.style?.barColorBy).toBe("candle");
    expect(volume?.calcParams).toEqual({ maPeriods: [5, 10, 20] });
    expect(volume?.figures.map((f) => f.key)).toEqual([
      "v",
      "ma5",
      "ma10",
      "ma20",
    ]);
    const regenerated = volume?.regenerateFigures?.({ maPeriods: [5, 10, 20, 60] });
    expect(regenerated?.map((f) => f.key)).toEqual([
      "v",
      "ma5",
      "ma10",
      "ma20",
      "ma60",
    ]);
  });

  test("custom registerIndicator works", () => {
    clearIndicatorRegistry();
    registerIndicator({
      name: "MyOsc",
      placement: "pane",
      calcParams: { period: 2 },
      figures: [{ key: "v", type: "line" }],
      calc: (kline) => ({
        v: kline.map((b) => b.c),
      }),
    });
    expect(getIndicator("MyOsc")?.name).toBe("MyOsc");
  });
});
