import {
  applyCanvasResolution,
  computeCanvasResolution,
  type CanvasResolution,
} from "../utils/canvasSize";
import { measureElementSize } from "./measureElementSize";

export type ResizableCanvasView = {
  resize(width: number, height: number, dpr: number): void;
  flushRender(): void;
};

/**
 * 测量 container → 设置 canvas 缓冲区分辨率 → view.resize → flushRender。
 */
export const syncCanvasViewSize = (
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  view: ResizableCanvasView,
): CanvasResolution => {
  const { width, height } = measureElementSize(container);
  const resolution = computeCanvasResolution(width, height);
  applyCanvasResolution(ctx, resolution);
  view.resize(resolution.cssWidth, resolution.cssHeight, resolution.dpr);
  view.flushRender();
  return resolution;
};
