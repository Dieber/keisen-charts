export type CanvasResolution = {
  /** CSS 布局宽度（逻辑像素） */
  cssWidth: number;
  /** CSS 布局高度（逻辑像素） */
  cssHeight: number;
  dpr: number;
  /** canvas 缓冲区宽度（物理像素） */
  bufferWidth: number;
  /** canvas 缓冲区高度（物理像素） */
  bufferHeight: number;
};

export const getDevicePixelRatio = (): number => {
  if (typeof globalThis === "undefined") return 1;
  const dpr = (globalThis as { devicePixelRatio?: number }).devicePixelRatio;
  return Number.isFinite(dpr) && dpr! > 0 ? dpr! : 1;
};

export const computeCanvasResolution = (
  cssWidth: number,
  cssHeight: number,
  dpr = getDevicePixelRatio(),
): CanvasResolution => ({
  cssWidth,
  cssHeight,
  dpr,
  bufferWidth: Math.max(1, Math.round(cssWidth * dpr)),
  bufferHeight: Math.max(1, Math.round(cssHeight * dpr)),
});

/**
 * 根据 CSS 布局尺寸设置 canvas 缓冲区分辨率，并将 ctx 变换到逻辑坐标系。
 * 调用方应保证 cssWidth/cssHeight 来自挂载后的实际布局尺寸。
 */
export const applyCanvasResolution = (
  ctx: CanvasRenderingContext2D,
  resolution: CanvasResolution,
): void => {
  const { bufferWidth, bufferHeight, dpr } = resolution;
  const canvas = ctx.canvas;

  if (canvas.width !== bufferWidth) {
    canvas.width = bufferWidth;
  }
  if (canvas.height !== bufferHeight) {
    canvas.height = bufferHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};
