import {
  applyStroke,
  clipInfiniteLine,
  distPointToLine,
  HIT_THRESHOLD_PX,
  parallelThroughPoint,
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

const paintLine = (
  ctx: CanvasRenderingContext2D,
  a: Point2,
  b: Point2,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const clipped = clipInfiniteLine(a, b, helpers.width, helpers.height);
  if (!clipped) return;
  applyStroke(ctx, style);
  strokeSegment(ctx, clipped[0], clipped[1]);
};

const paintParallel = (
  ctx: CanvasRenderingContext2D,
  p0: DrawingPoint,
  p1: DrawingPoint,
  p2: DrawingPoint | undefined,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const a = toPx(p0, helpers);
  const b = toPx(p1, helpers);
  paintLine(ctx, a, b, helpers, style);
  if (!p2) return;
  const c = toPx(p2, helpers);
  const d = parallelThroughPoint(a, b, c);
  paintLine(ctx, c, d, helpers, style);
};

export const parallelLinesTool: DrawingToolModule = {
  id: "parallelLines",
  pointsRequired: 3,
  paintDraft(ctx, points, helpers, style) {
    const draftStyle = { ...style, lineDash: style.lineDash ?? [4, 4] };
    if (points.length >= 3) {
      paintParallel(
        ctx,
        points[0]!,
        points[1]!,
        points[2],
        helpers,
        draftStyle,
      );
      return;
    }
    if (points.length === 2) {
      // 已定方向：第一条线 + 预览平行线（若有 preview 作为第 3 点则由 Layer 拼入）
      paintParallel(
        ctx,
        points[0]!,
        points[1]!,
        undefined,
        helpers,
        draftStyle,
      );
      return;
    }
    if (points.length === 1) {
      const a = toPx(points[0]!, helpers);
      applyStroke(ctx, draftStyle);
      ctx.beginPath();
      ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  paint(ctx, drawing, helpers) {
    const [p0, p1, p2] = drawing.points;
    if (!p0 || !p1) return;
    paintParallel(ctx, p0, p1, p2, helpers, drawing.style);
  },
  hitTest(x, y, drawing, helpers) {
    const [p0, p1, p2] = drawing.points;
    if (!p0 || !p1) return null;
    const a = toPx(p0, helpers);
    const b = toPx(p1, helpers);
    let dist = distPointToLine({ x, y }, a, b);
    if (p2) {
      const c = toPx(p2, helpers);
      const d = parallelThroughPoint(a, b, c);
      dist = Math.min(dist, distPointToLine({ x, y }, c, d));
    }
    return dist <= HIT_THRESHOLD_PX ? { dist } : null;
  },
};
