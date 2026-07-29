import { describe, expect, test } from "bun:test";
import { snapBarIndex } from "./crosshair";
import { indexToX } from "./viewport";
import {
  buildMainKlineCrosshairLayerData,
  buildPaneCrosshairLayerData,
  buildXAxisCrosshairHighlight,
} from "../renderer/shared/buildCrosshairData";
import { createInitialKeisenState } from "../store/createKeisenStore";
import { createStore } from "../store/Store";
import type { KlineBar } from "../types/kline";

const sampleKline: KlineBar[] = Array.from({ length: 100 }, (_, i) => ({
  t: 1_700_000_000_000 + i * 60_000,
  o: 100 + i * 0.1,
  h: 101 + i * 0.1,
  l: 99 + i * 0.1,
  c: 100.5 + i * 0.1,
  v: 1000 + i,
}));

const createTestStore = () =>
  createStore(
    createInitialKeisenState({
      kline: sampleKline,
    }),
  );

describe("crosshair math", () => {
  test("snapBarIndex rounds to nearest integer bar", () => {
    const store = createTestStore();
    const { indexDomain, viewportWidth } = store.getState().ui;
    const klineLength = store.getState().data.kline.length;

    const barIndex = snapBarIndex(500, indexDomain, viewportWidth, klineLength);
    const x = indexToX(barIndex, indexDomain, viewportWidth);

    expect(barIndex).toBeGreaterThanOrEqual(0);
    expect(barIndex).toBeLessThan(klineLength);
    expect(Number.isInteger(barIndex)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(viewportWidth);
  });

  test("buildMainKlineCrosshairLayerData aligns vertical line with bar center", () => {
    const store = createTestStore();
    const state = store.getState();
    const barIndex = 10;
    const crosshair = {
      barIndex,
      sourceViewId: "main" as const,
      localY: 100,
    };

    const data = buildMainKlineCrosshairLayerData(
      crosshair,
      state.ui,
      state.data.kline,
    );

    expect(data).not.toBeNull();
    expect(data?.x).toBe(
      indexToX(barIndex, state.ui.indexDomain, state.ui.viewportWidth),
    );
    expect(data?.showVertical).toBe(true);
    expect(data?.y).not.toBeNull();
  });

  test("returns null when crosshair is inactive", () => {
    const store = createTestStore();
    const state = store.getState();
    expect(
      buildMainKlineCrosshairLayerData(null, state.ui, state.data.kline),
    ).toBeNull();
  });

  test("main pane hides horizontal line when source is volume", () => {
    const store = createTestStore();
    const state = store.getState();
    const data = buildMainKlineCrosshairLayerData(
      { barIndex: 10, sourceViewId: "volume", localY: 50 },
      state.ui,
      state.data.kline,
    );

    expect(data?.showVertical).toBe(true);
    expect(data?.showHorizontal).toBe(false);
    expect(data?.y).toBeNull();
  });

  test("volume pane hides horizontal line when source is main", () => {
    const store = createTestStore();
    const state = store.getState();
    const data = buildPaneCrosshairLayerData(
      { barIndex: 10, sourceViewId: "main", localY: 50 },
      state.ui,
      "volume",
      state.data.kline,
    );

    expect(data?.showVertical).toBe(true);
    expect(data?.showHorizontal).toBe(false);
    expect(data?.y).toBeNull();
  });

  test("x-axis highlight uses YYYY-MM-DD hh:mm:ss format", () => {
    const store = createTestStore();
    const state = store.getState();
    const timestamp = Date.UTC(2024, 0, 15, 9, 30, 45);
    const kline = [{ ...sampleKline[0], t: timestamp }];

    const highlight = buildXAxisCrosshairHighlight(
      { barIndex: 0, sourceViewId: "main", localY: 10 },
      state.ui.indexDomain,
      state.ui.viewportWidth,
      kline,
    );

    expect(highlight?.label).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("x-axis highlight respects UTC timezone", () => {
    const store = createTestStore();
    const state = store.getState();
    const timestamp = Date.UTC(2024, 0, 15, 9, 30, 45);
    const kline = [{ ...sampleKline[0], t: timestamp }];

    const highlight = buildXAxisCrosshairHighlight(
      { barIndex: 0, sourceViewId: "main", localY: 10 },
      state.ui.indexDomain,
      state.ui.viewportWidth,
      kline,
      "UTC",
    );

    expect(highlight?.label).toBe("2024-01-15 09:30:45");
  });
});
