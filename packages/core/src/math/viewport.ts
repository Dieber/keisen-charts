import {
  BAR_BASE_SPACING,
  BAR_BASE_WIDTH,
  computeBarLayoutFromStep,
  type BarLayout,
} from "./barLayout";
import type { IndexDomain } from "../store/Store";
import type { KlineBar } from "../types/kline";

export const DEFAULT_RIGHT_OFFSET = 50;

/** 默认首屏可见 bar 数量 */
export const DEFAULT_VISIBLE_BARS = 80;

/** 最小可见 span（最大 zoom in） */
export const MIN_DOMAIN_SPAN = 5;

/** 最大可见 span（最大 zoom out） */
export const MAX_DOMAIN_SPAN = 500;

export type IndexDomainConstraints = {
  klineLength: number;
  viewportWidth: number;
  rightOffset: number;
  minSpan?: number;
  maxSpan?: number;
};

export const getDomainSpan = (domain: IndexDomain): number =>
  domain.end - domain.start;

/** 最老一根 K 线中心贴近视口右缘时对应的 domain.start */
export const getMinIndexDomainStart = (span: number): number => 0.5 - span;

export const indexToX = (
  index: number,
  domain: IndexDomain,
  viewportWidth: number,
): number => {
  const span = getDomainSpan(domain);
  if (span <= 0) return 0;
  return ((index + 0.5 - domain.start) / span) * viewportWidth;
};

export const xToIndex = (
  x: number,
  domain: IndexDomain,
  viewportWidth: number,
): number => {
  const span = getDomainSpan(domain);
  if (viewportWidth <= 0) return domain.start;
  return domain.start + (x / viewportWidth) * span - 0.5;
};

/** 像素 x 对应的连续索引位置（用于 zoom 锚点） */
export const xToContinuousIndex = (
  x: number,
  domain: IndexDomain,
  viewportWidth: number,
): number => {
  const span = getDomainSpan(domain);
  if (viewportWidth <= 0) return domain.start;
  return domain.start + (x / viewportWidth) * span;
};

export const getRightOffsetIndex = (
  domain: IndexDomain,
  viewportWidth: number,
  rightOffset: number,
): number => (rightOffset / viewportWidth) * getDomainSpan(domain);

export const computeBarLayoutFromDomain = (
  domain: IndexDomain,
  viewportWidth: number,
): BarLayout => {
  const span = getDomainSpan(domain);
  if (span <= 0 || viewportWidth <= 0) {
    return computeBarLayoutFromStep(BAR_BASE_WIDTH + BAR_BASE_SPACING);
  }
  const candleStep = viewportWidth / span;
  return computeBarLayoutFromStep(candleStep);
};

export const computeInitialIndexDomain = (
  klineLength: number,
  viewportWidth: number,
  rightOffset: number,
  defaultVisibleBars = DEFAULT_VISIBLE_BARS,
): IndexDomain => {
  const span = defaultVisibleBars;
  const rightOffsetIndex =
    viewportWidth > 0 ? (rightOffset / viewportWidth) * span : 0;
  const end = Math.max(0, klineLength - 1) + rightOffsetIndex;
  const start = end - span;
  return clampIndexDomain({ start, end }, {
    klineLength,
    viewportWidth,
    rightOffset,
  });
};

export const clampIndexDomain = (
  domain: IndexDomain,
  constraints: IndexDomainConstraints,
): IndexDomain => {
  const {
    klineLength,
    viewportWidth,
    rightOffset,
    minSpan = MIN_DOMAIN_SPAN,
    maxSpan = MAX_DOMAIN_SPAN,
  } = constraints;

  let span = Math.max(minSpan, Math.min(maxSpan, getDomainSpan(domain)));
  let start = domain.start;
  let end = start + span;

  const maxEnd =
    Math.max(0, klineLength - 1) +
    (viewportWidth > 0 ? (rightOffset / viewportWidth) * span : 0);
  const minStart = klineLength > 0 ? getMinIndexDomainStart(span) : 0;

  if (start < minStart) {
    start = minStart;
    end = start + span;
  }

  if (end > maxEnd) {
    end = maxEnd;
    start = end - span;
    if (start < minStart) start = minStart;
  }

  return { start, end };
};

export const panIndexDomain = (
  domain: IndexDomain,
  indexDelta: number,
  constraints: IndexDomainConstraints,
): IndexDomain =>
  clampIndexDomain(
    { start: domain.start + indexDelta, end: domain.end + indexDelta },
    constraints,
  );

export const zoomIndexDomain = (
  domain: IndexDomain,
  anchorContinuous: number,
  factor: number,
  constraints: IndexDomainConstraints,
): IndexDomain => {
  const span = getDomainSpan(domain);
  if (span <= 0) return domain;

  const newSpan = span * factor;
  const ratio = (anchorContinuous - domain.start) / span;

  return clampIndexDomain(
    {
      start: anchorContinuous - newSpan * ratio,
      end: anchorContinuous + newSpan * (1 - ratio),
    },
    constraints,
  );
};

const FOLLOW_LATEST_EPSILON = 0.5;

/** 判断视口是否贴近最新 bar（用于实时数据 auto follow） */
export const wasFollowingLatest = (
  domain: IndexDomain,
  klineLength: number,
  rightOffset: number,
  viewportWidth: number,
): boolean => {
  if (klineLength <= 0) return true;
  const maxEnd =
    klineLength -
    1 +
    getRightOffsetIndex(domain, viewportWidth, rightOffset);
  return domain.end >= maxEnd - FOLLOW_LATEST_EPSILON;
};

/** 判断 kline 变化是否为向前追加历史（prepend） */
export const isKlinePrepend = (
  kline: KlineBar[],
  prevKline: KlineBar[],
): boolean =>
  kline.length > prevKline.length &&
  prevKline.length > 0 &&
  kline[0]!.t !== prevKline[0]!.t &&
  kline[kline.length - 1]!.t === prevKline[prevKline.length - 1]!.t;

/**
 * kline 变长时是否应自动跟随最新 bar。
 * prepend 时 indexDomain 已由调用方偏移，不能再 follow latest。
 */
export const shouldFollowLatestOnKlineGrowth = (
  kline: KlineBar[],
  prevKline: KlineBar[],
  indexDomain: IndexDomain,
  rightOffset: number,
  viewportWidth: number,
): boolean => {
  if (kline.length <= prevKline.length) return false;
  if (isKlinePrepend(kline, prevKline)) return false;
  return wasFollowingLatest(
    indexDomain,
    prevKline.length,
    rightOffset,
    viewportWidth,
  );
};

export const followLatestIndexDomain = (
  domain: IndexDomain,
  klineLength: number,
  rightOffset: number,
  viewportWidth: number,
): IndexDomain => {
  const span = getDomainSpan(domain);
  const rightOffsetIndex = getRightOffsetIndex(domain, viewportWidth, rightOffset);
  const end = Math.max(0, klineLength - 1) + rightOffsetIndex;
  return clampIndexDomain(
    { start: end - span, end },
    { klineLength, viewportWidth, rightOffset },
  );
};
