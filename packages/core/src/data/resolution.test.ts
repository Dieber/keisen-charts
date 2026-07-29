import { describe, expect, test } from "bun:test";

import {
  buildCacheKey,
  resolutionToMs,
  resolutionToSeconds,
  resolutionToTimeFrame,
} from "./resolution";

describe("resolution", () => {
  test("resolutionToSeconds maps presets and minutes", () => {
    expect(resolutionToSeconds("1")).toBe(60);
    expect(resolutionToSeconds("15")).toBe(15 * 60);
    expect(resolutionToSeconds("1D")).toBe(24 * 60 * 60);
    expect(resolutionToSeconds("1W")).toBe(7 * 24 * 60 * 60);
    expect(resolutionToSeconds("1M")).toBe(30 * 24 * 60 * 60);
  });

  test("resolutionToMs and timeFrame", () => {
    expect(resolutionToMs("1")).toBe(60_000);
    expect(resolutionToTimeFrame("1")).toBe("1m");
    expect(resolutionToTimeFrame("60")).toBe("1h");
    expect(resolutionToTimeFrame("1D")).toBe("1d");
  });

  test("buildCacheKey", () => {
    expect(buildCacheKey("1")).toBe("_:1");
    expect(buildCacheKey("1", "BTC")).toBe("BTC:1");
  });
});
