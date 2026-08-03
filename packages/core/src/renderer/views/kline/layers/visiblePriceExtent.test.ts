import { describe, expect, test } from "bun:test";
import type { KlineBar } from "../../../../types/kline";
import { BOLLLayer } from "./BOLLLayer";
import { MALayer } from "./MALayer";
import {
  collectSeriesVisiblePrices,
  isVisiblePriceContributor,
} from "./visiblePriceExtent";

const makeBars = (count: number): KlineBar[] =>
  Array.from({ length: count }, (_, i) => {
    const c = 100 + Math.sin(i / 3) * 8;
    return {
      t: i,
      o: c - 1,
      h: c + 4,
      l: c - 4,
      c,
      v: 1,
    };
  });

describe("visiblePriceExtent", () => {
  test("collectSeriesVisiblePrices slices inclusive range", () => {
    expect(collectSeriesVisiblePrices([1, 2, 3, 4], 1, 2)).toEqual([2, 3]);
  });

  test("overlay layers contribute visible prices", () => {
    const kline = makeBars(30);
    const ma = new MALayer(5);
    const boll = new BOLLLayer(20, 2);

    expect(isVisiblePriceContributor(ma)).toBe(true);
    expect(isVisiblePriceContributor(boll)).toBe(true);

    const maValues = ma.collectVisiblePrices(kline, 10, 20);
    expect(maValues.some((v) => v !== null && Number.isFinite(v))).toBe(true);

    const bollValues = boll.collectVisiblePrices(kline, 20, 29);
    const finite = bollValues.filter(
      (v): v is number => v !== null && Number.isFinite(v),
    );
    expect(finite.length).toBeGreaterThan(0);
    expect(Math.max(...finite)).toBeGreaterThan(110);
    expect(Math.min(...finite)).toBeLessThan(90);
  });
});
