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

const paintVertical = (
  ctx: CanvasRenderingContext2D,
  barIndex: number,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const x = helpers.xOfBar(barIndex);
  applyStroke(ctx, style);
  strokeSegment(ctx, { x, y: 0 }, { x, y: helpers.height });
};

export const verticalTool: DrawingToolModule = {
  id: "vertical",
  pointsRequired: 1,
  paintDraft(ctx, points, helpers, style) {
    if (points[0]) paintVertical(ctx, points[0].barIndex, helpers, style);
  },
  paint(ctx, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return;
    paintVertical(ctx, p.barIndex, helpers, drawing.style);
  },
  hitTest(x, _y, drawing, helpers) {
    const p = drawing.points[0];
    if (!p) return null;
    const dist = Math.abs(x - helpers.xOfBar(p.barIndex));
    return dist <= HIT_THRESHOLD_PX ? { dist } : null;
  },
};
