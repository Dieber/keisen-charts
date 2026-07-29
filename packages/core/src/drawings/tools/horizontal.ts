import {
  applyStroke,
  HIT_THRESHOLD_PX,
  strokeSegment,
} from "../geometry";
import type {
  DrawingProjectHelpers,
  DrawingStyle,
  DrawingToolModule,
} from "../types";

const paintHorizontal = (
  ctx: CanvasRenderingContext2D,
  value: number,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const y = helpers.yOfValue(value);
  applyStroke(ctx, style);
  strokeSegment(ctx, { x: 0, y }, { x: helpers.width, y });
};

export const horizontalTool: DrawingToolModule = {
  id: "horizontal",
  pointsRequired: 1,
  paintDraft(ctx, points, helpers, style) {
    if (points[0]) paintHorizontal(ctx, points[0].value, helpers, style);
  },
  paint(ctx, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return;
    paintHorizontal(ctx, p.value, helpers, drawing.style);
  },
  hitTest(_x, y, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return null;
    const dist = Math.abs(y - helpers.yOfValue(p.value));
    return dist <= HIT_THRESHOLD_PX ? { dist } : null;
  },
};
