import type { KlineBar } from "../types/kline";
import type { Drawing, DrawingDraft, DrawingPoint, DrawingsState } from "./types";

/** 连续 barIndex → 时间（相邻 K 线线性插值） */
export const timeAtBarIndex = (
  kline: KlineBar[],
  barIndex: number,
): number => {
  if (kline.length === 0) return 0;
  if (barIndex <= 0) return kline[0]!.t;
  if (barIndex >= kline.length - 1) return kline[kline.length - 1]!.t;

  const i0 = Math.floor(barIndex);
  const i1 = Math.min(kline.length - 1, i0 + 1);
  const frac = barIndex - i0;
  const t0 = kline[i0]!.t;
  const t1 = kline[i1]!.t;
  return t0 + (t1 - t0) * frac;
};

/** 时间 → 连续 barIndex（相邻 K 线线性插值） */
export const barIndexAtTime = (
  kline: KlineBar[],
  time: number,
): number => {
  if (kline.length === 0) return 0;
  if (time <= kline[0]!.t) return 0;
  if (time >= kline[kline.length - 1]!.t) return kline.length - 1;

  let lo = 0;
  let hi = kline.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (kline[mid]!.t <= time) lo = mid;
    else hi = mid - 1;
  }

  const i0 = lo;
  const i1 = Math.min(kline.length - 1, i0 + 1);
  if (i0 === i1) return i0;

  const t0 = kline[i0]!.t;
  const t1 = kline[i1]!.t;
  if (t1 === t0) return i0;
  return i0 + (time - t0) / (t1 - t0);
};

/** 用 time 重算 barIndex；无 time 时原样返回 */
export const resolveDrawingPoint = (
  point: DrawingPoint,
  kline: KlineBar[],
): DrawingPoint => {
  if (
    typeof point.time === "number" &&
    Number.isFinite(point.time) &&
    kline.length > 0
  ) {
    return {
      ...point,
      barIndex: barIndexAtTime(kline, point.time),
    };
  }
  return point;
};

export const resolveDrawingPoints = (
  points: DrawingPoint[],
  kline: KlineBar[],
): DrawingPoint[] => points.map((p) => resolveDrawingPoint(p, kline));

/** 落笔时写入 time；若已有 time 则按 time 刷新 barIndex */
export const anchorDrawingPoint = (
  point: Omit<DrawingPoint, "time"> & { time?: number },
  kline: KlineBar[],
): DrawingPoint => {
  if (typeof point.time === "number" && Number.isFinite(point.time)) {
    return resolveDrawingPoint(
      {
        barIndex: point.barIndex,
        time: point.time,
        value: point.value,
      },
      kline,
    );
  }
  return {
    barIndex: point.barIndex,
    value: point.value,
    time: timeAtBarIndex(kline, point.barIndex),
  };
};

const mapPoints = (
  points: DrawingPoint[],
  mapPoint: (p: DrawingPoint) => DrawingPoint,
): DrawingPoint[] => points.map(mapPoint);

const mapDraft = (
  draft: DrawingDraft | null,
  mapPoint: (p: DrawingPoint) => DrawingPoint,
): DrawingDraft | null => {
  if (!draft) return null;
  return { ...draft, points: mapPoints(draft.points, mapPoint) };
};

const mapItems = (
  items: Record<string, Drawing>,
  mapPoint: (p: DrawingPoint) => DrawingPoint,
): Record<string, Drawing> => {
  const next: Record<string, Drawing> = {};
  for (const [id, drawing] of Object.entries(items)) {
    next[id] = {
      ...drawing,
      points: mapPoints(drawing.points, mapPoint),
    };
  }
  return next;
};

/** prepend 后：有 time 的按时间重映射；无 time 的按 delta 平移 barIndex */
export const remapDrawingsAfterPrepend = (
  drawings: DrawingsState,
  kline: KlineBar[],
  prependedCount: number,
): DrawingsState => {
  if (prependedCount === 0) return drawings;

  const mapPoint = (point: DrawingPoint): DrawingPoint => {
    if (typeof point.time === "number" && Number.isFinite(point.time)) {
      return {
        ...point,
        barIndex: barIndexAtTime(kline, point.time),
      };
    }
    return {
      ...point,
      barIndex: point.barIndex + prependedCount,
    };
  };

  return {
    ...drawings,
    items: mapItems(drawings.items, mapPoint),
    draft: mapDraft(drawings.draft, mapPoint),
  };
};

/** 绘制 / hitTest 前：把所有点的 barIndex 从 time 刷新 */
export const resolveDrawingForProject = (
  drawing: Drawing,
  kline: KlineBar[],
): Drawing => ({
  ...drawing,
  points: resolveDrawingPoints(drawing.points, kline),
});
