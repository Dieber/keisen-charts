import { describe, expect, test } from "bun:test";

import {
  clipInfiniteLine,
  clipRay,
  distPointToLine,
  distPointToRay,
  parallelThroughPoint,
} from "./geometry";

describe("drawings geometry", () => {
  test("clipInfiniteLine keeps horizontal line across width", () => {
    const clipped = clipInfiniteLine(
      { x: 10, y: 50 },
      { x: 20, y: 50 },
      100,
      80,
    );
    expect(clipped).not.toBeNull();
    expect(clipped![0].y).toBeCloseTo(50);
    expect(clipped![1].y).toBeCloseTo(50);
    expect(Math.min(clipped![0].x, clipped![1].x)).toBeCloseTo(0);
    expect(Math.max(clipped![0].x, clipped![1].x)).toBeCloseTo(100);
  });

  test("clipRay only extends in direction", () => {
    const clipped = clipRay({ x: 40, y: 40 }, { x: 60, y: 40 }, 100, 80);
    expect(clipped).not.toBeNull();
    expect(clipped![0].x).toBeCloseTo(40);
    expect(clipped![1].x).toBeCloseTo(100);
  });

  test("parallelThroughPoint preserves direction", () => {
    const p = parallelThroughPoint(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 3, y: 5 },
    );
    expect(p).toEqual({ x: 13, y: 5 });
    expect(distPointToLine({ x: 3, y: 5 }, { x: 3, y: 5 }, p)).toBeCloseTo(0);
  });

  test("distPointToRay is zero on ray and positive behind origin", () => {
    const origin = { x: 10, y: 10 };
    const through = { x: 20, y: 10 };
    expect(distPointToRay({ x: 30, y: 10 }, origin, through)).toBeCloseTo(0);
    expect(distPointToRay({ x: 0, y: 10 }, origin, through)).toBeCloseTo(10);
  });
});
