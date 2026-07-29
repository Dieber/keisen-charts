import { describe, expect, test } from "bun:test";

import { createKeisenStore } from "../store/createKeisenStore";
import { createSampleKline } from "../store/testFixtures";
import { prependBarsInStore, replaceKlineInStore } from "../data/klineMutations";
import { drawingsActions } from "./DrawingController";
import { barIndexAtTime, timeAtBarIndex } from "./anchor";

describe("drawing time anchor", () => {
  test("timeAtBarIndex and barIndexAtTime roundtrip on integers", () => {
    const kline = createSampleKline(20);
    for (let i = 0; i < kline.length; i++) {
      const t = timeAtBarIndex(kline, i);
      expect(t).toBe(kline[i]!.t);
      expect(barIndexAtTime(kline, t)).toBeCloseTo(i, 8);
    }
  });

  test("prepend keeps drawing on the same candle time", () => {
    const store = createKeisenStore();
    const bars = createSampleKline(20);
    replaceKlineInStore(store, bars);

    const targetIndex = 10;
    const targetTime = bars[targetIndex]!.t;
    const id = drawingsActions.addDrawing(store, {
      tool: "vertical",
      paneId: "main",
      points: [{ barIndex: targetIndex, value: 100 }],
      style: { stroke: "#fff", lineWidth: 1 },
    });

    expect(store.getState().ui.drawings.items[id]?.points[0]?.time).toBe(
      targetTime,
    );

    const older = createSampleKline(5).map((bar, i) => ({
      ...bar,
      t: bars[0]!.t - (5 - i) * 60_000,
    }));
    const count = prependBarsInStore(store, older);
    expect(count).toBe(5);

    const point = store.getState().ui.drawings.items[id]!.points[0]!;
    expect(point.time).toBe(targetTime);
    expect(point.barIndex).toBeCloseTo(targetIndex + 5, 8);
    expect(store.getState().data.kline[Math.round(point.barIndex)]!.t).toBe(
      targetTime,
    );
  });
});
