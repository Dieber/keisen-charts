import { describe, expect, test } from "bun:test";
import {
  formatLegendValue,
  mergeLegendItems,
  type LegendItem,
} from "./legend";
import { resolveDataPanelBarIndex } from "./buildDataPanelData";

describe("mergeLegendItems", () => {
  test("merges same groupId into one row with sorted params", () => {
    const items: LegendItem[] = [
      {
        groupId: "MA",
        groupLabel: "MA",
        paramLabel: "10",
        sortKey: 10,
        order: 2,
        segments: [{ text: "MA10: 2", color: "#ff0" }],
      },
      {
        groupId: "MA",
        groupLabel: "MA",
        paramLabel: "5",
        sortKey: 5,
        order: 1,
        segments: [{ text: "MA5: 1", color: "#0ff" }],
      },
      {
        groupId: "EMA",
        groupLabel: "EMA",
        paramLabel: "12",
        sortKey: 12,
        order: 3,
        segments: [{ text: "EMA12: 3", color: "#f0f" }],
      },
    ];

    const rows = mergeLegendItems(items, "#fff");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.segments[0]!.text).toBe("MA(5,10)");
    expect(rows[0]!.segments.map((s) => s.text.trim())).toEqual([
      "MA(5,10)",
      "MA5: 1",
      "MA10: 2",
    ]);
    expect(rows[1]!.segments[0]!.text).toBe("EMA(12)");
  });
});

describe("formatLegendValue", () => {
  test("renders -- for nullish", () => {
    expect(formatLegendValue(null, (n) => String(n))).toBe("--");
    expect(formatLegendValue(undefined, (n) => String(n))).toBe("--");
    expect(formatLegendValue(1.5, (n) => n.toFixed(2))).toBe("1.50");
  });
});

describe("resolveDataPanelBarIndex", () => {
  test("uses crosshair when present", () => {
    expect(
      resolveDataPanelBarIndex({ barIndex: 3, sourceViewId: "main", localY: 0 }, 10),
    ).toBe(3);
  });

  test("falls back to last bar", () => {
    expect(resolveDataPanelBarIndex(null, 10)).toBe(9);
    expect(resolveDataPanelBarIndex(null, 0)).toBe(-1);
  });
});
