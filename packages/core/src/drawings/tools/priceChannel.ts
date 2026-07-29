import {
  applyStroke,
  HIT_THRESHOLD_PX,
  strokeSegment,
} from "../geometry";
import type {
  DrawingPoint,
  DrawingProjectHelpers,
  DrawingStyle,
  DrawingToolModule,
} from "../types";

const paintPriceChannel = (
  ctx: CanvasRenderingContext2D,
  point: DrawingPoint,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const x = helpers.xOfBar(point.barIndex);
  const y = helpers.yOfValue(point.value);
  applyStroke(ctx, style);
  strokeSegment(ctx, { x, y }, { x: helpers.width, y });

  const label =
    helpers.formatValue?.(point.value) ??
    point.value.toFixed(2);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = style.stroke;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  const padX = 4;
  const padY = 4;
  ctx.fillText(label, x + padX, y - padY);
};

export const priceChannelTool: DrawingToolModule = {
  id: "priceChannel",
  pointsRequired: 1,
  paintDraft(ctx, points, helpers, style) {
    if (points[0]) paintPriceChannel(ctx, points[0], helpers, style);
  },
  paint(ctx, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return;
    paintPriceChannel(ctx, p, helpers, drawing.style);
  },
  hitTest(x, y, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return null;
    const startX = helpers.xOfBar(p.barIndex);
    const lineY = helpers.yOfValue(p.value);
    if (x < startX - HIT_THRESHOLD_PX) return null;
    const dist = Math.abs(y - lineY);
    return dist <= HIT_THRESHOLD_PX ? { dist } : null;
  },
};
