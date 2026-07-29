import { describe, expect, test } from "bun:test";
import { resolveChartPointer } from "./resolveChartPointer";
import { createInitialKeisenState } from "../store/createKeisenStore";
import type { KlineBar } from "../types/kline";

const sampleKline: KlineBar[] = Array.from({ length: 100 }, (_, i) => ({
  t: 1_700_000_000_000 + i * 60_000,
  o: 100 + i * 0.1,
  h: 101 + i * 0.1,
  l: 99 + i * 0.1,
  c: 100.5 + i * 0.1,
  v: 1000 + i,
}));

describe("resolveChartPointer", () => {
  test("resolves main pane price + timestamp", () => {
    const state = createInitialKeisenState({ kline: sampleKline });
    const info = resolveChartPointer(state, {
      viewId: "main",
      x: state.ui.viewportWidth / 2,
      y: state.ui.viewportHeight / 2,
    });

    expect(info).not.toBeNull();
    expect(info!.chartId).toBe("main");
    expect(info!.barIndex).toBeGreaterThanOrEqual(0);
    expect(info!.barIndex).toBeLessThan(sampleKline.length);
    expect(info!.timestamp).toBe(sampleKline[info!.barIndex]!.t);
    expect(info!.value).toBeGreaterThan(state.ui.priceDomain.min);
    expect(info!.value).toBeLessThan(state.ui.priceDomain.max);
    expect(info!.x).toBe(state.ui.viewportWidth / 2);
    expect(info!.y).toBe(state.ui.viewportHeight / 2);
  });

  test("resolves volume pane with its domain", () => {
    const state = createInitialKeisenState({ kline: sampleKline });
    state.ui.panes.volume = {
      domain: { min: 0, max: 2000 },
      viewportHeight: 120,
      yAxisMode: "auto",
    };

    const info = resolveChartPointer(state, {
      viewId: "volume",
      x: 100,
      y: 60,
      pointerType: "mouse",
    });

    expect(info).not.toBeNull();
    expect(info!.chartId).toBe("volume");
    expect(info!.value).toBeCloseTo(1000, 0);
    expect(info!.pointerType).toBe("mouse");
  });

  test("returns null for empty kline", () => {
    const state = createInitialKeisenState({ kline: [] });
    expect(
      resolveChartPointer(state, { viewId: "main", x: 10, y: 10 }),
    ).toBeNull();
  });

  test("returns null for y-axis viewId", () => {
    const state = createInitialKeisenState({ kline: sampleKline });
    expect(
      resolveChartPointer(state, {
        viewId: "kline-y-axis",
        x: 10,
        y: 10,
      }),
    ).toBeNull();
  });

  test("snap=false keeps continuous barIndex clamped", () => {
    const state = createInitialKeisenState({ kline: sampleKline });
    const snapped = resolveChartPointer(
      state,
      { viewId: "main", x: 10, y: 10 },
      { snap: true },
    );
    const continuous = resolveChartPointer(
      state,
      { viewId: "main", x: 10, y: 10 },
      { snap: false },
    );

    expect(snapped).not.toBeNull();
    expect(continuous).not.toBeNull();
    expect(Number.isInteger(snapped!.barIndex)).toBe(true);
    expect(continuous!.barIndex).toBeGreaterThanOrEqual(0);
    expect(continuous!.barIndex).toBeLessThanOrEqual(sampleKline.length - 1);
  });
});
