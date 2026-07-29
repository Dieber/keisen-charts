import { describe, expect, test } from "bun:test";

import { getDateTimeParts } from "./getDateTimeParts";

describe("getDateTimeParts", () => {
  test("UTC reads calendar fields via getUTC*", () => {
    const t = Date.UTC(2024, 0, 1, 0, 0, 0);
    const parts = getDateTimeParts(t, "UTC");

    expect(parts).toEqual({
      year: 2024,
      month: 0,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      weekday: 1, // Monday
    });
  });

  test("UTC midnight is not always local midnight", () => {
    const t = Date.UTC(2024, 0, 1, 0, 0, 0);
    const utc = getDateTimeParts(t, "UTC");
    const local = getDateTimeParts(t, "local");

    expect(utc.hour).toBe(0);
    expect(utc.day).toBe(1);

    // In non-UTC runners, local hour/day may differ; only assert shape.
    expect(local.year).toBeGreaterThanOrEqual(2023);
    expect(local.month).toBeGreaterThanOrEqual(0);
    expect(local.month).toBeLessThanOrEqual(11);
    expect(local.day).toBeGreaterThanOrEqual(1);
    expect(local.day).toBeLessThanOrEqual(31);
  });

  test("local matches Date local getters", () => {
    const t = Date.UTC(2024, 5, 15, 12, 30, 45);
    const d = new Date(t);
    const parts = getDateTimeParts(t, "local");

    expect(parts.year).toBe(d.getFullYear());
    expect(parts.month).toBe(d.getMonth());
    expect(parts.day).toBe(d.getDate());
    expect(parts.hour).toBe(d.getHours());
    expect(parts.minute).toBe(d.getMinutes());
    expect(parts.second).toBe(d.getSeconds());
    expect(parts.weekday).toBe(d.getDay());
  });
});
