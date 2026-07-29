import { describe, expect, test } from "bun:test";
import {
  BAR_BASE_SPACING,
  BAR_BASE_WIDTH,
  computeBarLayoutFromStep,
  getCandleStep,
} from "../math/barLayout";

describe("computeBarLayoutFromStep", () => {
  test("base step yields base bar width 5", () => {
    expect(computeBarLayoutFromStep(BAR_BASE_WIDTH + BAR_BASE_SPACING)).toEqual({
      width: 5,
      spacing: 1,
    });
  });

  test("bar width and spacing are always integers", () => {
    for (const step of [1.2, 3, 6, 10, 15.5, 30, 60]) {
      const layout = computeBarLayoutFromStep(step);
      expect(Number.isInteger(layout.width)).toBe(true);
      expect(Number.isInteger(layout.spacing)).toBe(true);
    }
  });

  test("scales linearly with candleStep", () => {
    expect(computeBarLayoutFromStep(12)).toEqual({
      width: Math.round(BAR_BASE_WIDTH * 2),
      spacing: Math.round(BAR_BASE_SPACING * 2),
    });
    expect(computeBarLayoutFromStep(3)).toEqual({
      width: Math.max(1, Math.round(BAR_BASE_WIDTH * 0.5)),
      spacing: Math.max(0, Math.round(3 - Math.max(1, Math.round(BAR_BASE_WIDTH * 0.5)))),
    });
  });

  test("width never drops below 1", () => {
    expect(computeBarLayoutFromStep(0.6).width).toBe(1);
  });

  test("getCandleStep returns width + spacing", () => {
    const layout = computeBarLayoutFromStep(6);
    expect(getCandleStep(layout)).toBe(layout.width + layout.spacing);
  });
});
