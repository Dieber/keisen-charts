import {
  applyStroke,
  clipRay,
  distPointToRay,
  HIT_THRESHOLD_PX,
  strokeSegment,
  type Point2,
} from "../geometry";
import type {
  DrawingPoint,
  DrawingProjectHelpers,
  DrawingStyle,
  DrawingToolModule,
} from "../types";

const toPx = (
  p: DrawingPoint,
  helpers: DrawingProjectHelpers,
): Point2 => ({
  x: helpers.xOfBar(p.barIndex),
  y: helpers.yOfValue(p.value),
});

const paintRay = (
  ctx: CanvasRenderingContext2D,
  p0: DrawingPoint,
  p1: DrawingPoint,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const a = toPx(p0, helpers);
  const b = toPx(p1, helpers);
  const clipped = clipRay(a, b, helpers.width, helpers.height);
  if (!clipped) return;
  applyStroke(ctx, style);
  strokeSegment(ctx, clipped[0], clipped[1]);
};

export const rayTool: DrawingToolModule = {
  id: "ray",
  pointsRequired: 2,
  paintDraft(ctx, points, helpers, style) {
    if (points.length >= 2) {
      paintRay(ctx, points[0]!, points[1]!, helpers, {
        ...style,
        lineDash: style.lineDash ?? [4, 4],
      });
      return;
    }
    if (points.length === 1) {
      const a = toPx(points[0]!, helpers);
      applyStroke(ctx, { ...style, lineDash: [4, 4] });
      ctx.beginPath();
      ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  paint(ctx, drawing, helpers) {
    const [p0, p1] = drawing.points;
    if (!p0 || !p1) return;
    paintRay(ctx, p0, p1, helpers, drawing.style);
  },
  hitTest(x, y, drawing, helpers) {
    const [p0, p1] = drawing.points;
    if (!p0 || !p1) return null;
    const dist = distPointToRay(
      { x, y },
      toPx(p0, helpers),
      toPx(p1, helpers),
    );
    return dist <= HIT_THRESHOLD_PX ? { dist } : null;
  },
};
