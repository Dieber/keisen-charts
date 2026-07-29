import { describe, expect, test } from "bun:test";
import {
  createPriceFormatter,
  decimalsFromMinMove,
  decimalsFromStep,
  formatCompactTiny,
  formatPrice,
  inferValueDecimals,
} from "./priceFormat";

describe("decimalsFromMinMove / decimalsFromStep", () => {
  test("derives decimals from minMove", () => {
    expect(decimalsFromMinMove(0.0001)).toBe(4);
    expect(decimalsFromMinMove(0.01)).toBe(2);
    expect(decimalsFromMinMove(1)).toBe(0);
  });

  test("derives decimals from step", () => {
    expect(decimalsFromStep(0.005)).toBe(3);
    expect(decimalsFromStep(0.01)).toBe(2);
    expect(decimalsFromStep(500)).toBe(0);
  });
});

describe("formatCompactTiny", () => {
  test("formats meme-style tiny prices", () => {
    expect(formatCompactTiny(0.000000000532)).toBe("0.0{9}532");
    expect(formatCompactTiny(-0.00000123)).toBe("-0.0{5}123");
  });

  test("returns null when leading zeros below threshold", () => {
    expect(formatCompactTiny(1.09)).toBeNull();
    expect(formatCompactTiny(0.00123)).toBeNull();
  });
});

describe("formatPrice / createPriceFormatter", () => {
  test("XRP tick with minMove and precision shows 4 decimals", () => {
    const fmt = createPriceFormatter({
      type: "price",
      minMove: 0.0001,
      precision: 4,
      useGrouping: false,
    });
    expect(fmt(1.09, { kind: "tick", step: 0.005 })).toBe("1.0900");
    expect(fmt(1.095, { kind: "tick", step: 0.005 })).toBe("1.0950");
    expect(fmt(1.1, { kind: "tick", step: 0.005 })).toBe("1.1000");
  });

  test("step-aware zero-config keeps adjacent tick labels distinct", () => {
    const fmt = createPriceFormatter({ type: "price", useGrouping: false });
    const step = 0.005;
    const a = fmt(1.09, { kind: "tick", step });
    const b = fmt(1.095, { kind: "tick", step });
    const c = fmt(1.1, { kind: "tick", step });
    expect(a).toBe("1.090");
    expect(b).toBe("1.095");
    expect(c).toBe("1.100");
    expect(new Set([a, b, c]).size).toBe(3);
  });

  test("large numbers use grouping by default", () => {
    const label = formatPrice(95000, { kind: "tick", step: 500 }, {
      type: "price",
    });
    expect(label).toBe("95,000");
  });

  test("compactTiny formats extreme small values", () => {
    const label = formatPrice(
      0.000000000532,
      { kind: "value" },
      { type: "price", compactTiny: true, useGrouping: false },
    );
    expect(label).toBe("0.0{9}532");
  });

  test("custom formatter is used as-is", () => {
    const fmt = createPriceFormatter({
      type: "custom",
      formatter: (value) => `$${value.toFixed(2)}`,
    });
    expect(fmt(1.1, { kind: "value" })).toBe("$1.10");
  });

  test("non-finite values become --", () => {
    expect(formatPrice(Number.NaN, { kind: "value" })).toBe("--");
  });
});

describe("inferValueDecimals", () => {
  test("keeps meaningful fractional digits within 2-8", () => {
    expect(inferValueDecimals(1.0923)).toBe(4);
    expect(inferValueDecimals(100)).toBe(2);
  });
});
