import { DEFAULT_FIB_LEVELS, fibValueAt } from "../fibLevels";
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

const paintFib = (
  ctx: CanvasRenderingContext2D,
  p0: DrawingPoint,
  p1: DrawingPoint,
  helpers: DrawingProjectHelpers,
  style: DrawingStyle,
): void => {
  const x0 = helpers.xOfBar(p0.barIndex);
  const x1 = helpers.xOfBar(p1.barIndex);
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const high = Math.max(p0.value, p1.value);
  const low = Math.min(p0.value, p1.value);

  applyStroke(ctx, style);
  for (const level of DEFAULT_FIB_LEVELS) {
    const value = fibValueAt(high, low, level);
    const y = helpers.yOfValue(value);
    strokeSegment(ctx, { x: left, y }, { x: right, y });

    const label =
      `${level}  ` +
      (helpers.formatValue?.(value) ?? value.toFixed(2));
    ctx.font = "10px sans-serif";
    ctx.fillStyle = style.stroke;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(label, right + 4, y - 2);
  }
};

export const fibRetracementTool: DrawingToolModule = {
  id: "fibRetracement",
  pointsRequired: 2,
  paintDraft(ctx, points, helpers, style) {
    if (points.length >= 2) {
      paintFib(ctx, points[0]!, points[1]!, helpers, {
        ...style,
        lineDash: style.lineDash ?? [4, 4],
      });
      return;
    }
    if (points.length === 1) {
      const y = helpers.yOfValue(points[0]!.value);
      const x = helpers.xOfBar(points[0]!.barIndex);
      applyStroke(ctx, { ...style, lineDash: [4, 4] });
      strokeSegment(ctx, { x: 0, y }, { x: helpers.width, y });
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  paint(ctx, drawing, helpers) {
    const [p0, p1] = drawing.points;
    if (!p0 || !p1) return;
    paintFib(ctx, p0, p1, helpers, drawing.style);
  },
  hitTest(x, y, drawing, helpers) {
    const [p0, p1] = drawing.points;
    if (!p0 || !p1) return null;
    const x0 = helpers.xOfBar(p0.barIndex);
    const x1 = helpers.xOfBar(p1.barIndex);
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    if (x < left - HIT_THRESHOLD_PX || x > right + HIT_THRESHOLD_PX) {
      return null;
    }
    const high = Math.max(p0.value, p1.value);
    const low = Math.min(p0.value, p1.value);
    let best = Infinity;
    for (const level of DEFAULT_FIB_LEVELS) {
      const lineY = helpers.yOfValue(fibValueAt(high, low, level));
      best = Math.min(best, Math.abs(y - lineY));
    }
    return best <= HIT_THRESHOLD_PX ? { dist: best } : null;
  },
};
