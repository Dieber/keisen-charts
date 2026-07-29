import { describe, expect, test } from "bun:test";
import { createPriceFormatter } from "./priceFormat";
import {
  computeAutoPriceDomain,
  computeNiceTicks,
  panPriceDomain,
  priceToY,
  yToPrice,
  zoomPriceDomain,
} from "./priceViewport";

describe("priceViewport", () => {
  test("priceToY and yToPrice are inverse mappings", () => {
    const domain = { min: 100, max: 200 };
    const viewportHeight = 400;
    const price = 150;

    const y = priceToY(price, domain, viewportHeight);
    const restored = yToPrice(y, domain, viewportHeight);

    expect(restored).toBeCloseTo(price, 6);
  });

  test("computeAutoPriceDomain applies vertical padding", () => {
    const domain = computeAutoPriceDomain(
      [{ t: 1, o: 10, h: 20, l: 5, c: 15, v: 1 }],
      0.1,
    );

    expect(domain.min).toBeCloseTo(3.5, 6);
    expect(domain.max).toBeCloseTo(21.5, 6);
  });

  test("panPriceDomain shifts min and max together", () => {
    const next = panPriceDomain({ min: 10, max: 20 }, 5);
    expect(next).toEqual({ min: 15, max: 25 });
  });

  test("zoomPriceDomain keeps anchor price fixed", () => {
    const domain = { min: 0, max: 100 };
    const viewportHeight = 200;
    const anchorPrice = 40;
    const anchorY = priceToY(anchorPrice, domain, viewportHeight);

    const next = zoomPriceDomain(domain, anchorPrice, 0.5);
    const nextAnchorY = priceToY(anchorPrice, next, viewportHeight);

    expect(nextAnchorY).toBeCloseTo(anchorY, 6);
    expect(next.max - next.min).toBeCloseTo(50, 6);
  });

  test("computeNiceTicks respects minimum pixel spacing", () => {
    const ticks = computeNiceTicks({ min: 100, max: 200 }, 400, {
      minPixelSpacing: 40,
      formatLabel: (value) => value.toFixed(0),
    });

    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks.length).toBeLessThanOrEqual(12);
  });

  test("XRP-like domain keeps adjacent tick labels distinct", () => {
    const ticks = computeNiceTicks({ min: 1.09, max: 1.11 }, 400, {
      minPixelSpacing: 40,
    });

    expect(ticks.length).toBeGreaterThanOrEqual(2);
    const labels = ticks.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test("minMove + precision yield TradingView-like XRP labels", () => {
    const formatLabel = createPriceFormatter({
      type: "price",
      minMove: 0.0001,
      precision: 4,
      useGrouping: false,
    });
    const ticks = computeNiceTicks({ min: 1.09, max: 1.11 }, 400, {
      minMove: 0.0001,
      formatLabel,
    });

    expect(ticks.some((t) => t.label === "1.0900")).toBe(true);
    expect(ticks.some((t) => t.label === "1.0950" || t.label === "1.1000")).toBe(
      true,
    );
  });
});
