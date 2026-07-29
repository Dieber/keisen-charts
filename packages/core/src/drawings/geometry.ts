export type Point2 = { x: number; y: number };

export const distPointToPoint = (a: Point2, b: Point2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
};

/** 点到无线直线距离 */
export const distPointToLine = (
  p: Point2,
  a: Point2,
  b: Point2,
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return distPointToPoint(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.sqrt(lenSq);
};

/** 点到线段距离 */
export const distPointToSegment = (
  p: Point2,
  a: Point2,
  b: Point2,
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return distPointToPoint(p, a);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq),
  );
  return distPointToPoint(p, { x: a.x + t * dx, y: a.y + t * dy });
};

/** 点到射线距离（从 a 经 b 向一侧无限） */
export const distPointToRay = (
  p: Point2,
  origin: Point2,
  through: Point2,
): number => {
  const dx = through.x - origin.x;
  const dy = through.y - origin.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return distPointToPoint(p, origin);
  const t = ((p.x - origin.x) * dx + (p.y - origin.y) * dy) / lenSq;
  if (t < 0) return distPointToPoint(p, origin);
  return distPointToPoint(p, {
    x: origin.x + t * dx,
    y: origin.y + t * dy,
  });
};

/**
 * Liang–Barsky：将无线直线裁剪到矩形 [0,w]×[0,h]。
 * 返回两端点；退化时返回 null。
 */
export const clipInfiniteLine = (
  a: Point2,
  b: Point2,
  width: number,
  height: number,
): [Point2, Point2] | null => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return null;

  let t0 = -Infinity;
  let t1 = Infinity;

  const clip = (p: number, q: number): boolean => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (
    !clip(-dx, a.x) ||
    !clip(dx, width - a.x) ||
    !clip(-dy, a.y) ||
    !clip(dy, height - a.y)
  ) {
    return null;
  }

  if (t0 === -Infinity && t1 === Infinity) {
    // 完全在框内的退化方向 — 用边界扩展
    const scale = Math.max(width, height) * 2;
    const len = Math.hypot(dx, dy) || 1;
    const ux = (dx / len) * scale;
    const uy = (dy / len) * scale;
    return [
      { x: a.x - ux, y: a.y - uy },
      { x: a.x + ux, y: a.y + uy },
    ];
  }

  const p0 = {
    x: a.x + Math.max(t0, -1e6) * dx,
    y: a.y + Math.max(t0, -1e6) * dy,
  };
  const p1 = {
    x: a.x + Math.min(t1, 1e6) * dx,
    y: a.y + Math.min(t1, 1e6) * dy,
  };
  return [p0, p1];
};

/** 射线：从 origin 经 through，裁剪到矩形 */
export const clipRay = (
  origin: Point2,
  through: Point2,
  width: number,
  height: number,
): [Point2, Point2] | null => {
  const dx = through.x - origin.x;
  const dy = through.y - origin.y;
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return null;

  let t0 = 0;
  let t1 = Infinity;

  const clip = (p: number, q: number): boolean => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (
    !clip(-dx, origin.x) ||
    !clip(dx, width - origin.x) ||
    !clip(-dy, origin.y) ||
    !clip(dy, height - origin.y)
  ) {
    return null;
  }

  if (!Number.isFinite(t1) || t1 < t0) return null;

  return [
    { x: origin.x + t0 * dx, y: origin.y + t0 * dy },
    { x: origin.x + t1 * dx, y: origin.y + t1 * dy },
  ];
};

/** 过 point 且平行于 (a→b) 的直线上另一参考点 */
export const parallelThroughPoint = (
  a: Point2,
  b: Point2,
  point: Point2,
): Point2 => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { x: point.x + dx, y: point.y + dy };
};

export const applyStroke = (
  ctx: CanvasRenderingContext2D,
  style: { stroke: string; lineWidth: number; lineDash?: number[] },
): void => {
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  ctx.setLineDash(style.lineDash ?? []);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
};

export const strokeSegment = (
  ctx: CanvasRenderingContext2D,
  a: Point2,
  b: Point2,
): void => {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};

export const HIT_THRESHOLD_PX = 6;
