import { afterEach, describe, expect, test } from "bun:test";

import {
  buildGridRows,
  clearChartSlotRegistry,
  getRequestedSubSlots,
  getSubPanePlacements,
  getXAxisRow,
  reconcileSubPaneWeights,
  registerChartSlot,
} from "./chartLayout";

describe("chartLayout", () => {
  afterEach(() => {
    clearChartSlotRegistry();
  });

  test("buildGridRows and placements", () => {
    const slots = ["volume", "macd"];
    const rows = buildGridRows({
      visibleSlots: slots,
      subPaneWeights: [0.25, 0.15],
    });
    expect(rows).toBe("minmax(0, 1fr) minmax(80px, 25%) minmax(80px, 15%) auto");
    expect(getXAxisRow(2)).toBe(4);

    const placements = getSubPanePlacements(slots);
    expect(placements.volume).toEqual({ chartRow: 2, yAxisRow: 2 });
    expect(placements.macd).toEqual({ chartRow: 3, yAxisRow: 3 });
  });

  test("reconcileSubPaneWeights keeps previous", () => {
    expect(
      reconcileSubPaneWeights(["volume"], [0.3], ["volume", "macd"]),
    ).toEqual([0.3, 0.15]);
  });

  test("registerChartSlot and getRequestedSubSlots", () => {
    registerChartSlot("CustomChart", "custom");
    expect(
      getRequestedSubSlots({ main: true, volume: true, custom: true }),
    ).toContain("custom");
  });
});
