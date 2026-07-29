import { describe, expect, it } from "bun:test";

import { computeAutoIndicatorDomain } from "./indicatorDomain";

describe("computeAutoIndicatorDomain", () => {
  it("pads both sides for extent", () => {
    const domain = computeAutoIndicatorDomain([10, 20], {
      paddingRatio: 0.1,
    });
    expect(domain.min).toBeCloseTo(9);
    expect(domain.max).toBeCloseTo(21);
  });

  it("includes zero then pads for extentIncludeZero", () => {
    const domain = computeAutoIndicatorDomain([2, 8], {
      paddingRatio: 0.1,
      includeZero: true,
    });
    expect(domain.min).toBeLessThan(0);
    expect(domain.max).toBeGreaterThan(8);
  });

  it("pins min at 0 and only pads max for fromZero", () => {
    const domain = computeAutoIndicatorDomain([100, 200], {
      paddingRatio: 0.1,
      fromZero: true,
    });
    expect(domain.min).toBe(0);
    expect(domain.max).toBeCloseTo(220);
  });

  it("fromZero empty values returns [0, 1]", () => {
    expect(
      computeAutoIndicatorDomain([], { fromZero: true }),
    ).toEqual({ min: 0, max: 1 });
  });
});
