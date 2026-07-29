import { expect, test } from "bun:test";

import {
  applyCanvasResolution,
  computeCanvasResolution,
} from "./canvasSize";

test("computeCanvasResolution rounds buffer size by dpr", () => {
  const resolution = computeCanvasResolution(1000, 500, 2);

  expect(resolution).toEqual({
    cssWidth: 1000,
    cssHeight: 500,
    dpr: 2,
    bufferWidth: 2000,
    bufferHeight: 1000,
  });
});

test("computeCanvasResolution clamps zero layout size to 1px buffer", () => {
  const resolution = computeCanvasResolution(0, 0, 1);

  expect(resolution.bufferWidth).toBe(1);
  expect(resolution.bufferHeight).toBe(1);
});

test("applyCanvasResolution sets buffer and logical transform", () => {
  const canvas = {
    width: 0,
    height: 0,
  } as HTMLCanvasElement;

  const ctx = {
    canvas,
    setTransform: () => {},
  } as CanvasRenderingContext2D;

  let transform: number[] = [];
  ctx.setTransform = (...args: number[]) => {
    transform = args;
  };

  const resolution = computeCanvasResolution(800, 400, 2);
  applyCanvasResolution(ctx, resolution);

  expect(canvas.width).toBe(1600);
  expect(canvas.height).toBe(800);
  expect(transform).toEqual([2, 0, 0, 2, 0, 0]);
});

test("applyCanvasResolution does not reset an unchanged canvas buffer", () => {
  let widthWrites = 0;
  let heightWrites = 0;
  const canvas = {} as HTMLCanvasElement;

  Object.defineProperties(canvas, {
    width: {
      get: () => 1600,
      set: () => {
        widthWrites += 1;
      },
    },
    height: {
      get: () => 800,
      set: () => {
        heightWrites += 1;
      },
    },
  });

  const ctx = {
    canvas,
    setTransform: () => {},
  } as CanvasRenderingContext2D;

  applyCanvasResolution(ctx, computeCanvasResolution(800, 400, 2));

  expect(widthWrites).toBe(0);
  expect(heightWrites).toBe(0);
});
