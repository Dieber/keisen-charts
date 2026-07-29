import { describe, expect, test } from "bun:test";

import {
  appendPeriodList,
  normalizeHex,
  nextPeriodListStep,
  partitionIndicatorParamFields,
  patchParams,
  readNumberParam,
  readPeriods,
  removePeriodListAt,
  toColorInputValue,
  updatePeriodListAt,
} from "./panelHelpers";
import type { IndicatorSetting } from "./types";

const setting = (partial: Partial<IndicatorSetting> = {}): IndicatorSetting => ({
  visible: true,
  colors: {},
  params: {},
  ...partial,
});

describe("panelHelpers", () => {
  test("normalizes hex colors", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("FF0000")).toBe("#ff0000");
    expect(normalizeHex("notahex")).toBeNull();
    expect(toColorInputValue("notahex")).toBe("#888888");
  });

  test("reads and patches params", () => {
    const s = setting({ params: { periods: [5, 10], fast: 12 } });
    expect(readPeriods(s, "periods")).toEqual([5, 10]);
    expect(readNumberParam(s, "fast")).toBe(12);
    expect(readNumberParam(s, "missing", 3)).toBe(3);
    expect(patchParams(s, { fast: 8 })).toEqual({ periods: [5, 10], fast: 8 });
  });

  test("partitions param fields", () => {
    const partitioned = partitionIndicatorParamFields({
      colorLabels: { dif: "DIF", dea: "DEA" },
      paramFields: [
        {
          key: "periods",
          label: "周期",
          kind: "periodList",
          colorKeyPrefix: "ma",
        },
        { key: "fast", label: "快线", kind: "number" },
      ],
    });
    expect(partitioned.periodListField?.key).toBe("periods");
    expect(partitioned.numberFields).toHaveLength(1);
    expect(partitioned.staticColorEntries).toEqual([]);
  });

  test("mutates period lists", () => {
    expect(nextPeriodListStep("ma")).toBe(10);
    expect(nextPeriodListStep("rsi")).toBe(6);

    const s = setting({
      colors: { ma5: "#111111" },
      params: { periods: [5, 10] },
    });
    const field = {
      key: "periods",
      label: "周期",
      kind: "periodList" as const,
      colorKeyPrefix: "ma",
    };

    expect(updatePeriodListAt([5, 10], s, field, 0, "20")).toEqual({
      nextPeriods: [20, 10],
      nextColors: { ma20: "#111111" },
    });
    expect(removePeriodListAt([5, 10], 0, 1)).toEqual([10]);
    expect(removePeriodListAt([5], 0, 1)).toBeNull();

    const appended = appendPeriodList([5, 10], s, field, 12);
    expect(appended?.nextPeriods).toEqual([5, 10, 20]);
    expect(typeof appended?.nextColors.ma20).toBe("string");
  });
});
