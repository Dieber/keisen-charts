import { describe, expect, test } from "bun:test";
import {
  clampIndexDomain,
  computeInitialIndexDomain,
  DEFAULT_RIGHT_OFFSET,
  followLatestIndexDomain,
  getDomainSpan,
  getMinIndexDomainStart,
  indexToX,
  isKlinePrepend,
  panIndexDomain,
  shouldFollowLatestOnKlineGrowth,
  wasFollowingLatest,
  xToIndex,
  zoomIndexDomain,
} from "../math/viewport";

describe("viewport index domain", () => {
  const viewportWidth = 1000;
  const rightOffset = DEFAULT_RIGHT_OFFSET;

  test("indexToX and xToIndex are inverse for bar centers", () => {
    const domain = { start: 100.5, end: 150.2 };
    for (const index of [100, 105, 120, 150]) {
      const x = indexToX(index, domain, viewportWidth);
      expect(xToIndex(x, domain, viewportWidth)).toBeCloseTo(index, 5);
    }
  });

  test("computeInitialIndexDomain includes right offset in end", () => {
    const domain = computeInitialIndexDomain(200, viewportWidth, rightOffset);
    const span = getDomainSpan(domain);
    const rightOffsetIndex = (rightOffset / viewportWidth) * span;
    expect(domain.end).toBeCloseTo(199 + rightOffsetIndex, 5);
    expect(domain.start).toBeCloseTo(domain.end - span, 5);
  });

  test("panIndexDomain shifts start and end together", () => {
    const domain = { start: 100, end: 180 };
    const next = panIndexDomain(domain, -10, {
      klineLength: 200,
      viewportWidth,
      rightOffset,
    });
    expect(next.start).toBe(90);
    expect(next.end).toBe(170);
    expect(getDomainSpan(next)).toBe(getDomainSpan(domain));
  });

  test("panIndexDomain clamps at left boundary when oldest bar reaches right edge", () => {
    const domain = { start: 5, end: 85 };
    const span = getDomainSpan(domain);
    const next = panIndexDomain(domain, -(span + 10), {
      klineLength: 200,
      viewportWidth,
      rightOffset,
    });
    expect(next.start).toBeCloseTo(0.5 - span, 5);
    expect(next.end).toBeCloseTo(0.5, 5);
  });

  test("zoomIndexDomain keeps anchor pixel fixed", () => {
    const domain = { start: 100, end: 180 };
    const anchorX = 500;
    const anchorContinuous = anchorX / viewportWidth * getDomainSpan(domain) + domain.start;
    const next = zoomIndexDomain(domain, anchorContinuous, 0.975, {
      klineLength: 200,
      viewportWidth,
      rightOffset,
    });
    const xAfter =
      ((anchorContinuous - next.start) / getDomainSpan(next)) * viewportWidth;
    expect(xAfter).toBeCloseTo(anchorX, 5);
    expect(getDomainSpan(next)).toBeLessThan(getDomainSpan(domain));
  });

  test("clampIndexDomain keeps oldest bar center at right edge at min start", () => {
    const span = 80;
    const minStart = getMinIndexDomainStart(span);
    const clamped = clampIndexDomain(
      { start: minStart - 10, end: minStart - 10 + span },
      { klineLength: 200, viewportWidth, rightOffset },
    );
    expect(clamped.start).toBeCloseTo(minStart, 5);
    expect(indexToX(0, clamped, viewportWidth)).toBeCloseTo(viewportWidth, 5);
  });

  test("clampIndexDomain allows end beyond last bar for right padding", () => {
    const domain = { start: 150, end: 230 };
    const clamped = clampIndexDomain(domain, {
      klineLength: 200,
      viewportWidth,
      rightOffset,
    });
    const span = getDomainSpan(clamped);
    const maxEnd = 199 + (rightOffset / viewportWidth) * span;
    expect(clamped.end).toBeLessThanOrEqual(maxEnd + 1e-9);
  });

  test("wasFollowingLatest returns true when end is at latest bar", () => {
    const domain = computeInitialIndexDomain(200, viewportWidth, rightOffset);
    expect(wasFollowingLatest(domain, 200, rightOffset, viewportWidth)).toBe(true);
  });

  test("wasFollowingLatest returns false when scrolled to history", () => {
    const domain = { start: 0, end: 80 };
    expect(wasFollowingLatest(domain, 200, rightOffset, viewportWidth)).toBe(false);
  });

  test("followLatestIndexDomain preserves span and moves end to latest", () => {
    const domain = computeInitialIndexDomain(200, viewportWidth, rightOffset);
    const span = getDomainSpan(domain);
    const next = followLatestIndexDomain(domain, 210, rightOffset, viewportWidth);
    expect(getDomainSpan(next)).toBeCloseTo(span, 5);
    expect(next.end).toBeGreaterThan(208);
  });

  test("isKlinePrepend detects history prepend", () => {
    const prevKline = Array.from({ length: 100 }, (_, i) => ({
      t: i * 60_000,
      o: 1,
      h: 1,
      l: 1,
      c: 1,
      v: 1,
    }));
    const prepended = [
      ...Array.from({ length: 50 }, (_, i) => ({
        t: (i - 50) * 60_000,
        o: 1,
        h: 1,
        l: 1,
        c: 1,
        v: 1,
      })),
      ...prevKline,
    ];
    expect(isKlinePrepend(prepended, prevKline)).toBe(true);
    expect(isKlinePrepend([...prevKline, { t: 100 * 60_000, o: 1, h: 1, l: 1, c: 1, v: 1 }], prevKline)).toBe(false);
  });

  test("shouldFollowLatestOnKlineGrowth skips prepend after indexDomain offset", () => {
    const prevKline = Array.from({ length: 100 }, (_, i) => ({
      t: i * 60_000,
      o: 1,
      h: 1,
      l: 1,
      c: 1,
      v: 1,
    }));
    const prependedCount = 50;
    const kline = [
      ...Array.from({ length: prependedCount }, (_, i) => ({
        t: (i - prependedCount) * 60_000,
        o: 1,
        h: 1,
        l: 1,
        c: 1,
        v: 1,
      })),
      ...prevKline,
    ];
    const indexDomain = { start: 3 + prependedCount, end: 83 + prependedCount };

    expect(
      shouldFollowLatestOnKlineGrowth(
        kline,
        prevKline,
        indexDomain,
        rightOffset,
        viewportWidth,
      ),
    ).toBe(false);
  });

  test("shouldFollowLatestOnKlineGrowth still follows append at latest", () => {
    const prevKline = Array.from({ length: 100 }, (_, i) => ({
      t: i * 60_000,
      o: 1,
      h: 1,
      l: 1,
      c: 1,
      v: 1,
    }));
    const indexDomain = computeInitialIndexDomain(100, viewportWidth, rightOffset);
    const kline = [
      ...prevKline,
      { t: 100 * 60_000, o: 1, h: 1, l: 1, c: 1, v: 1 },
    ];

    expect(
      shouldFollowLatestOnKlineGrowth(
        kline,
        prevKline,
        indexDomain,
        rightOffset,
        viewportWidth,
      ),
    ).toBe(true);
  });
});
