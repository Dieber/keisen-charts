import { describe, expect, test } from "bun:test";

import { DEFAULT_TIMEZONE, resolveTimezone } from "./resolveTimezone";

describe("resolveTimezone", () => {
  test("defaults to local", () => {
    expect(resolveTimezone()).toEqual({ timezone: DEFAULT_TIMEZONE });
    expect(resolveTimezone(undefined)).toEqual({ timezone: "local" });
  });

  test("accepts local and UTC", () => {
    expect(resolveTimezone("local")).toEqual({ timezone: "local" });
    expect(resolveTimezone("UTC")).toEqual({ timezone: "UTC" });
  });

  test("unknown string falls back to local", () => {
    expect(resolveTimezone("Asia/Shanghai")).toEqual({ timezone: "local" });
  });
});
