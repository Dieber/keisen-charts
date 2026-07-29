import { describe, expect, test } from "bun:test";

import { mergeCalcParams } from "./mergeCalcParams";

describe("mergeCalcParams", () => {
  test("merges object defaults with numeric props", () => {
    expect(
      mergeCalcParams(
        { fast: 12, slow: 26, signal: 9 },
        { children: null, fast: 10, slow: 20 },
      ),
    ).toEqual({ fast: 10, slow: 20, signal: 9 });
  });

  test("array defaults accept calcParams override", () => {
    expect(mergeCalcParams([14], { calcParams: [7, 14] })).toEqual([7, 14]);
    expect(mergeCalcParams([14], { period: 7 })).toEqual([14]);
  });
});
