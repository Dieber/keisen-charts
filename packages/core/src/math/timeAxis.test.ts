import { describe, expect, test } from "bun:test";

import type { KlineBar } from "../types/kline";
import {
  classifyTimeBoundary,
  computeTimeAxisTicks,
  defaultFormatTimeLabel,
  DEFAULT_MIN_TIME_TICK_PIXEL_SPACING,
  MS_DAY,
  MS_HOUR,
  MS_MINUTE,
} from "./timeAxis";
import { indexToX } from "./viewport";

const makeBar = (t: number): KlineBar => ({
  t,
  o: 100,
  h: 110,
  l: 90,
  c: 105,
  v: 1,
});

/** 生成连续日 K 数据（UTC 午夜） */
const makeDailyKline = (
  startMs: number,
  count: number,
  stepMs = MS_DAY,
): KlineBar[] =>
  Array.from({ length: count }, (_, i) => makeBar(startMs + i * stepMs));

describe("timeAxis", () => {
  test("classifyTimeBoundary detects year and month boundaries", () => {
    const yearStart = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const monthStart = new Date(2024, 10, 1, 0, 0, 0).getTime();
    const regularDay = new Date(2024, 10, 15, 0, 0, 0).getTime();

    expect(classifyTimeBoundary(yearStart)).toBe("year");
    expect(classifyTimeBoundary(monthStart)).toBe("month");
    expect(classifyTimeBoundary(regularDay)).toBe("day");
  });

  test("classifyTimeBoundary detects minute and second boundaries", () => {
    const hourStart = new Date(2024, 10, 15, 12, 0, 0).getTime();
    const minuteStart = new Date(2024, 10, 15, 12, 30, 0).getTime();
    const secondTick = new Date(2024, 10, 15, 12, 30, 45).getTime();

    expect(classifyTimeBoundary(hourStart)).toBe("hour");
    expect(classifyTimeBoundary(minuteStart)).toBe("minute");
    expect(classifyTimeBoundary(secondTick)).toBe("second");
  });

  test("defaultFormatTimeLabel shows HH:mm:ss for second ticks and short spans", () => {
    const timestamp = new Date(2024, 10, 15, 12, 30, 45).getTime();

    expect(
      defaultFormatTimeLabel({
        timestamp,
        visibleTimeSpanMs: 5 * MS_MINUTE,
        boundary: "second",
        locale: "en",
        timezone: "local",
        weekStart: 1,
      }),
    ).toBe("12:30:45");

    expect(
      defaultFormatTimeLabel({
        timestamp: new Date(2024, 10, 15, 12, 30, 0).getTime(),
        visibleTimeSpanMs: 2 * MS_MINUTE,
        boundary: "minute",
        locale: "en",
        timezone: "local",
        weekStart: 1,
      }),
    ).toBe("12:30:00");

    expect(
      defaultFormatTimeLabel({
        timestamp: new Date(2024, 10, 15, 12, 30, 0).getTime(),
        visibleTimeSpanMs: 2 * MS_HOUR,
        boundary: "minute",
        locale: "en",
        timezone: "local",
        weekStart: 1,
      }),
    ).toBe("12:30");
  });

  test("classifyTimeBoundary UTC uses Date.UTC midnight", () => {
    const yearStart = Date.UTC(2024, 0, 1, 0, 0, 0);
    const monthStart = Date.UTC(2024, 10, 1, 0, 0, 0);
    const regularDay = Date.UTC(2024, 10, 15, 0, 0, 0);

    expect(classifyTimeBoundary(yearStart, 1, "UTC")).toBe("year");
    expect(classifyTimeBoundary(monthStart, 1, "UTC")).toBe("month");
    expect(classifyTimeBoundary(regularDay, 1, "UTC")).toBe("day");
  });

  test("classifyTimeBoundary respects weekStart", () => {
    const sunday = new Date(2024, 10, 3, 0, 0, 0).getTime();
    const monday = new Date(2024, 10, 4, 0, 0, 0).getTime();

    expect(classifyTimeBoundary(sunday, 0)).toBe("week");
    expect(classifyTimeBoundary(sunday, 1)).toBe("day");
    expect(classifyTimeBoundary(monday, 1)).toBe("week");
  });

  test("classifyTimeBoundary UTC weekStart Monday", () => {
    const sunday = Date.UTC(2024, 10, 3, 0, 0, 0);
    const monday = Date.UTC(2024, 10, 4, 0, 0, 0);

    expect(classifyTimeBoundary(sunday, 0, "UTC")).toBe("week");
    expect(classifyTimeBoundary(sunday, 1, "UTC")).toBe("day");
    expect(classifyTimeBoundary(monday, 1, "UTC")).toBe("week");
  });

  test("returns empty ticks for empty kline", () => {
    const ticks = computeTimeAxisTicks(
      { start: 0, end: 80 },
      800,
      [],
    );
    expect(ticks).toEqual([]);
  });

  test("year boundary shows year label", () => {
    const start = new Date(2023, 11, 28, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 10);
    const ticks = computeTimeAxisTicks(
      { start: 0, end: 9 },
      900,
      kline,
      { minPixelSpacing: 60 },
    );

    const yearTick = ticks.find(
      (tick) => tick.timestamp === new Date(2024, 0, 1, 0, 0, 0).getTime(),
    );
    expect(yearTick).toBeDefined();
    expect(yearTick?.label).toBe("2024");
    expect(yearTick?.priority).toBe("year");
  });

  test("UTC year boundary is independent of runner local TZ", () => {
    const start = Date.UTC(2023, 11, 28, 0, 0, 0);
    const kline = makeDailyKline(start, 10);
    const yearMs = Date.UTC(2024, 0, 1, 0, 0, 0);
    const ticks = computeTimeAxisTicks(
      { start: 0, end: 9 },
      900,
      kline,
      { timezone: "UTC", minPixelSpacing: 60 },
    );

    const yearTick = ticks.find((tick) => tick.timestamp === yearMs);
    expect(yearTick).toBeDefined();
    expect(yearTick?.label).toBe("2024");
    expect(yearTick?.priority).toBe("year");
  });

  test("month boundary shows month label", () => {
    const start = new Date(2024, 9, 28, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 10);
    const ticks = computeTimeAxisTicks(
      { start: 0, end: 9 },
      900,
      kline,
      { minPixelSpacing: 60 },
    );

    const monthTick = ticks.find(
      (tick) => tick.timestamp === new Date(2024, 10, 1, 0, 0, 0).getTime(),
    );
    expect(monthTick).toBeDefined();
    expect(monthTick?.label).toBe("Nov");
    expect(monthTick?.priority).toBe("month");
  });

  test("zh locale formats month boundary", () => {
    const start = new Date(2024, 9, 28, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 10);
    const ticks = computeTimeAxisTicks(
      { start: 0, end: 9 },
      900,
      kline,
      { locale: "zh", minPixelSpacing: 60 },
    );

    const monthTick = ticks.find(
      (tick) => tick.timestamp === new Date(2024, 10, 1, 0, 0, 0).getTime(),
    );
    expect(monthTick?.label).toBe("11月");
  });

  test("respects minimum pixel spacing between adjacent ticks", () => {
    const start = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 200);
    const viewportWidth = 800;
    const indexDomain = { start: 0, end: 199 };
    const minPixelSpacing = DEFAULT_MIN_TIME_TICK_PIXEL_SPACING;

    const ticks = computeTimeAxisTicks(
      indexDomain,
      viewportWidth,
      kline,
      { minPixelSpacing },
    );

    expect(ticks.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < ticks.length; i += 1) {
      const prevX = indexToX(ticks[i - 1].barIndex, indexDomain, viewportWidth);
      const currX = indexToX(ticks[i].barIndex, indexDomain, viewportWidth);
      expect(currX - prevX).toBeGreaterThanOrEqual(minPixelSpacing - 0.01);
    }
  });

  test("tick count stays within reasonable bounds for wide viewport", () => {
    const start = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 500);
    const viewportWidth = 1000;
    const maxTickCount = Math.floor(
      viewportWidth / DEFAULT_MIN_TIME_TICK_PIXEL_SPACING,
    );

    const ticks = computeTimeAxisTicks(
      { start: 0, end: 499 },
      viewportWidth,
      kline,
    );

    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.length).toBeLessThanOrEqual(maxTickCount + 2);
  });

  test("single visible bar returns at least one tick", () => {
    const kline = [makeBar(new Date(2024, 5, 15, 12, 0, 0).getTime())];
    const ticks = computeTimeAxisTicks({ start: 0, end: 1 }, 400, kline);

    expect(ticks.length).toBeGreaterThanOrEqual(1);
    expect(ticks[0].barIndex).toBe(0);
  });

  test("panning preserves tick bar indices in overlapping viewport", () => {
    const start = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 200);
    const viewportWidth = 800;
    const span = 80;
    const minPixelSpacing = DEFAULT_MIN_TIME_TICK_PIXEL_SPACING;

    const domainA = { start: 20, end: 20 + span };
    const domainB = { start: 25, end: 25 + span };

    const ticksA = computeTimeAxisTicks(domainA, viewportWidth, kline, {
      minPixelSpacing,
    });
    const ticksB = computeTimeAxisTicks(domainB, viewportWidth, kline, {
      minPixelSpacing,
    });

    const indicesA = new Set(ticksA.map((tick) => tick.barIndex));
    const sharedIndices = ticksB
      .map((tick) => tick.barIndex)
      .filter((index) => indicesA.has(index));

    expect(sharedIndices.length).toBeGreaterThan(0);

    for (const index of sharedIndices) {
      const tickA = ticksA.find((tick) => tick.barIndex === index);
      const tickB = ticksB.find((tick) => tick.barIndex === index);
      expect(tickA?.label).toBe(tickB?.label);
    }
  });

  test("viewport before first bar still shows interval ticks for grid", () => {
    const start = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 200);
    const viewportWidth = 1000;
    const span = 80;
    const indexDomain = { start: 0.5 - span, end: 0.5 };
    const minPixelSpacing = DEFAULT_MIN_TIME_TICK_PIXEL_SPACING;

    const ticks = computeTimeAxisTicks(indexDomain, viewportWidth, kline, {
      minPixelSpacing,
    });

    expect(ticks.length).toBeGreaterThanOrEqual(2);

    for (const tick of ticks) {
      const x = indexToX(tick.barIndex, indexDomain, viewportWidth);
      expect(x).toBeGreaterThanOrEqual(-minPixelSpacing);
      expect(x).toBeLessThanOrEqual(viewportWidth + minPixelSpacing);
    }
  });

  test("panning does not replace a tick with a neighbor at similar screen position", () => {
    const start = new Date(2024, 0, 1, 0, 0, 0).getTime();
    const kline = makeDailyKline(start, 200);
    const viewportWidth = 800;
    const span = 80;

    const domainA = { start: 30, end: 30 + span };
    const domainB = { start: 31, end: 31 + span };

    const ticksA = computeTimeAxisTicks(domainA, viewportWidth, kline);
    const ticksB = computeTimeAxisTicks(domainB, viewportWidth, kline);

    const leftTickA = ticksA[0];
    const leftTickB = ticksB[0];

    if (!leftTickA || !leftTickB) return;

    const xA = indexToX(leftTickA.barIndex, domainA, viewportWidth);
    const xB = indexToX(leftTickB.barIndex, domainB, viewportWidth);

    expect(Math.abs(xA - xB)).toBeLessThan(20);
    expect(leftTickB.barIndex).toBe(leftTickA.barIndex);
    expect(leftTickB.label).toBe(leftTickA.label);
  });
});
