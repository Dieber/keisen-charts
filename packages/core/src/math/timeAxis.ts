import type { KlineBar } from "../types/kline";
import type { IndexDomain } from "../store/Store";
import { getDateTimeParts } from "../time/getDateTimeParts";
import type { DateTimeParts, KlineTimezonePreset } from "../time/types";
import { getDomainSpan, indexToX } from "./viewport";

/** X 轴刻度最小像素间距，控制密度（类似 TradingView） */
export const DEFAULT_MIN_TIME_TICK_PIXEL_SPACING = 72;

const MS_MINUTE = 60_000;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
const MS_WEEK = 7 * MS_DAY;
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

export type TimeAxisLocale = "en" | "zh";

export type TimeBoundaryPriority =
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

const BOUNDARY_PRIORITY_RANK: Record<TimeBoundaryPriority, number> = {
  minute: 0,
  hour: 1,
  day: 2,
  week: 3,
  month: 4,
  year: 5,
};

type GranularityLevel = TimeBoundaryPriority;

const GRANULARITY_LADDER: GranularityLevel[] = [
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
];

export type TimeLabelContext = {
  timestamp: number;
  visibleTimeSpanMs: number;
  boundary: TimeBoundaryPriority;
  locale: TimeAxisLocale;
  timezone: KlineTimezonePreset;
  weekStart: 0 | 1;
};

export type TimeAxisOptions = {
  minPixelSpacing?: number;
  locale?: TimeAxisLocale;
  /** 省略则默认 "local"（与库默认一致） */
  timezone?: KlineTimezonePreset;
  weekStart?: 0 | 1;
  formatLabel?: (ctx: TimeLabelContext) => string;
};

export type TimeAxisTick = {
  barIndex: number;
  timestamp: number;
  label: string;
  priority: TimeBoundaryPriority;
};

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const pad2 = (value: number): string => String(value).padStart(2, "0");

const niceBarInterval = (roughInterval: number): number => {
  if (!Number.isFinite(roughInterval) || roughInterval <= 0) return 1;

  const exponent = Math.floor(Math.log10(roughInterval));
  const fraction = roughInterval / 10 ** exponent;
  let niceFraction: number;

  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  return Math.max(1, Math.round(niceFraction * 10 ** exponent));
};

/** 判断 timestamp 是否命中指定粒度及以上的时间边界 */
export const classifyTimeBoundary = (
  timestamp: number,
  weekStart: 0 | 1 = 1,
  timezone: KlineTimezonePreset = "local",
): TimeBoundaryPriority => {
  const {
    month,
    day: date,
    hour: hours,
    minute: minutes,
    second: seconds,
    weekday: day,
  } = getDateTimeParts(timestamp, timezone);

  if (
    month === 0 &&
    date === 1 &&
    hours === 0 &&
    minutes === 0 &&
    seconds === 0
  ) {
    return "year";
  }

  if (date === 1 && hours === 0 && minutes === 0 && seconds === 0) {
    return "month";
  }

  if (day === weekStart && hours === 0 && minutes === 0 && seconds === 0) {
    return "week";
  }

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return "day";
  }

  if (minutes === 0 && seconds === 0) {
    return "hour";
  }

  return "minute";
};

const meetsGranularity = (
  boundary: TimeBoundaryPriority,
  granularity: GranularityLevel,
): boolean =>
  BOUNDARY_PRIORITY_RANK[boundary] >= BOUNDARY_PRIORITY_RANK[granularity];

const formatHourMinute = (parts: DateTimeParts): string =>
  `${pad2(parts.hour)}:${pad2(parts.minute)}`;

const formatMonthDay = (parts: DateTimeParts): string =>
  `${pad2(parts.month + 1)}-${pad2(parts.day)}`;

const formatYearMonth = (parts: DateTimeParts): string =>
  `${parts.year}-${pad2(parts.month + 1)}`;

/** 上下文感知的默认时间标签格式化 */
export const defaultFormatTimeLabel = (ctx: TimeLabelContext): string => {
  const { timestamp, visibleTimeSpanMs, boundary, locale, timezone } = ctx;
  const parts = getDateTimeParts(timestamp, timezone);

  if (boundary === "year") {
    return locale === "zh" ? `${parts.year}年` : String(parts.year);
  }

  if (boundary === "month") {
    if (locale === "zh") return `${parts.month + 1}月`;
    return EN_MONTHS[parts.month] ?? String(parts.month + 1);
  }

  if (boundary === "week") {
    if (locale === "zh") return formatMonthDay(parts);
    return `${EN_WEEKDAYS[parts.weekday]} ${parts.day}`;
  }

  if (visibleTimeSpanMs < MS_DAY) {
    return formatHourMinute(parts);
  }

  if (visibleTimeSpanMs < 4 * MS_WEEK) {
    return formatMonthDay(parts);
  }

  if (visibleTimeSpanMs < 2 * MS_YEAR) {
    return formatYearMonth(parts);
  }

  return locale === "zh" ? `${parts.year}年` : String(parts.year);
};

type CandidateTick = {
  barIndex: number;
  timestamp: number;
  priority: TimeBoundaryPriority;
};

/** 估算 K 线平均 bar 间隔（毫秒），用于 zoom 级别判定 */
const estimateAverageBarDurationMs = (kline: KlineBar[]): number => {
  if (kline.length < 2) return MS_DAY;

  const sampleCount = Math.min(kline.length - 1, 64);
  const step = Math.max(1, Math.floor((kline.length - 1) / sampleCount));
  const durations: number[] = [];

  for (let i = 0; i < kline.length - 1; i += step) {
    const curr = kline[i];
    const next = kline[i + 1];
    if (!curr || !next) continue;
    const delta = next.t - curr.t;
    if (delta > 0) durations.push(delta);
  }

  if (durations.length === 0) return MS_DAY;

  durations.sort((a, b) => a - b);
  return durations[Math.floor(durations.length / 2)] ?? MS_DAY;
};

const collectGlobalBoundaryCandidates = (
  kline: KlineBar[],
  granularity: GranularityLevel,
  weekStart: 0 | 1,
  timezone: KlineTimezonePreset,
): CandidateTick[] => {
  const candidates: CandidateTick[] = [];

  for (let i = 0; i < kline.length; i += 1) {
    const timestamp = kline[i]?.t;
    if (timestamp === undefined) continue;

    const boundary = classifyTimeBoundary(timestamp, weekStart, timezone);
    if (!meetsGranularity(boundary, granularity)) continue;

    candidates.push({ barIndex: i, timestamp, priority: boundary });
  }

  return candidates;
};

const collectGlobalIntervalCandidates = (
  kline: KlineBar[],
  intervalBars: number,
  domainStart: number,
  avgBarMs: number,
  weekStart: 0 | 1,
  timezone: KlineTimezonePreset,
): CandidateTick[] => {
  const candidates: CandidateTick[] = [];
  const minBar =
    domainStart < 0
      ? Math.floor(domainStart / intervalBars) * intervalBars
      : 0;

  for (let i = minBar; i < kline.length; i += intervalBars) {
    const timestamp =
      i >= 0 ? (kline[i]?.t ?? 0) : (kline[0]?.t ?? 0) + i * avgBarMs;
    candidates.push({
      barIndex: i,
      timestamp,
      priority: classifyTimeBoundary(timestamp, weekStart, timezone),
    });
  }

  return candidates;
};

/**
 * 在 index 空间做碰撞检测，保证平移时 tick 锚点稳定（不随可见范围重算）。
 * 高优先级边界 tick 优先保留。
 */
const selectStableTicks = (
  candidates: CandidateTick[],
  minIndexGap: number,
  kline: KlineBar[],
  weekStart: 0 | 1,
  timezone: KlineTimezonePreset,
): CandidateTick[] => {
  const sorted = [...candidates].sort((a, b) => {
    const rankDiff = 2 -
      BOUNDARY_PRIORITY_RANK[b.priority] - BOUNDARY_PRIORITY_RANK[a.priority];
    if (rankDiff !== 0) return rankDiff;
    return a.barIndex - b.barIndex;
  });

  const selected: CandidateTick[] = [];

  for (const candidate of sorted) {
    const timestamp = candidate.timestamp || kline[candidate.barIndex]?.t;
    if (timestamp === undefined) continue;

    const normalized: CandidateTick = {
      barIndex: candidate.barIndex,
      timestamp,
      priority:
        candidate.priority === "minute" && candidate.timestamp === 0
          ? classifyTimeBoundary(timestamp, weekStart, timezone)
          : candidate.priority,
    };

    const tooClose = selected.some(
      (tick) => Math.abs(tick.barIndex - normalized.barIndex) < minIndexGap,
    );
    if (tooClose) continue;

    selected.push(normalized);
  }

  return selected.sort((a, b) => a.barIndex - b.barIndex);
};

const pickGranularityForZoom = (
  kline: KlineBar[],
  domainSpan: number,
  minIndexGap: number,
  weekStart: 0 | 1,
  timezone: KlineTimezonePreset,
): GranularityLevel => {
  const avgBarMs = estimateAverageBarDurationMs(kline);
  const zoomTimeSpanMs = domainSpan * avgBarMs;
  const maxTickCount = Math.max(2, Math.floor(domainSpan / minIndexGap));

  for (const granularity of GRANULARITY_LADDER) {
    const boundaries = collectGlobalBoundaryCandidates(
      kline,
      granularity,
      weekStart,
      timezone,
    );
    if (boundaries.length === 0) continue;
    if (boundaries.length <= maxTickCount) return granularity;
  }

  if (zoomTimeSpanMs < MS_DAY) return "hour";
  if (zoomTimeSpanMs < 4 * MS_WEEK) return "day";
  if (zoomTimeSpanMs < 2 * MS_YEAR) return "month";
  return "year";
};

const buildGlobalTickCandidates = (
  kline: KlineBar[],
  domainSpan: number,
  domainStart: number,
  minIndexGap: number,
  weekStart: 0 | 1,
  timezone: KlineTimezonePreset,
): CandidateTick[] => {
  const maxTickCount = Math.max(2, Math.floor(domainSpan / minIndexGap));
  const intervalBars = Math.max(
    minIndexGap,
    niceBarInterval(domainSpan / maxTickCount),
  );
  const avgBarMs = estimateAverageBarDurationMs(kline);

  const granularity = pickGranularityForZoom(
    kline,
    domainSpan,
    minIndexGap,
    weekStart,
    timezone,
  );

  const boundaryCandidates = collectGlobalBoundaryCandidates(
    kline,
    granularity,
    weekStart,
    timezone,
  );
  const intervalCandidates = collectGlobalIntervalCandidates(
    kline,
    intervalBars,
    domainStart,
    avgBarMs,
    weekStart,
    timezone,
  );

  const merged = new Map<number, CandidateTick>();
  for (const tick of intervalCandidates) {
    merged.set(tick.barIndex, tick);
  }
  for (const tick of boundaryCandidates) {
    const existing = merged.get(tick.barIndex);
    if (
      !existing ||
      BOUNDARY_PRIORITY_RANK[tick.priority] >
        BOUNDARY_PRIORITY_RANK[existing.priority]
    ) {
      merged.set(tick.barIndex, tick);
    }
  }

  return selectStableTicks(
    [...merged.values()],
    minIndexGap,
    kline,
    weekStart,
    timezone,
  );
};

/** 仅过滤当前视口内（含边距）应绘制的 tick，不改变 tick 锚点 */
const filterTicksInViewport = (
  ticks: CandidateTick[],
  indexDomain: IndexDomain,
  viewportWidth: number,
  minPixelSpacing: number,
): CandidateTick[] => {
  const margin = minPixelSpacing;

  return ticks.filter((tick) => {
    const x = indexToX(tick.barIndex, indexDomain, viewportWidth);
    return x >= -margin && x <= viewportWidth + margin;
  });
};

/**
 * 根据视口宽度、index domain 与 K 线时间数据，计算层级化时间刻度。
 * tick 锚定在全局 bar 索引网格上，平移时只改变可见子集，不替换锚点。
 */
export const computeTimeAxisTicks = (
  indexDomain: IndexDomain,
  viewportWidth: number,
  kline: KlineBar[],
  options: TimeAxisOptions = {},
): TimeAxisTick[] => {
  const minPixelSpacing =
    options.minPixelSpacing ?? DEFAULT_MIN_TIME_TICK_PIXEL_SPACING;
  const locale = options.locale ?? "en";
  const timezone = options.timezone ?? "local";
  const weekStart = options.weekStart ?? 1;
  const formatLabel = options.formatLabel ?? defaultFormatTimeLabel;

  const domainSpan = getDomainSpan(indexDomain);
  if (domainSpan <= 0 || viewportWidth <= 0 || kline.length === 0) return [];

  const candleStep = viewportWidth / domainSpan;
  const minIndexGap = Math.max(
    1,
    Math.ceil(minPixelSpacing / Math.max(candleStep, Number.EPSILON)),
  );

  const avgBarMs = estimateAverageBarDurationMs(kline);
  const visibleTimeSpanMs = domainSpan * avgBarMs;

  const globalTicks = buildGlobalTickCandidates(
    kline,
    domainSpan,
    indexDomain.start,
    minIndexGap,
    weekStart,
    timezone,
  );

  const visibleTicks = filterTicksInViewport(
    globalTicks,
    indexDomain,
    viewportWidth,
    minPixelSpacing,
  );

  return visibleTicks.map((tick) => {
    const boundary = classifyTimeBoundary(tick.timestamp, weekStart, timezone);
    return {
      barIndex: tick.barIndex,
      timestamp: tick.timestamp,
      priority: boundary,
      label: formatLabel({
        timestamp: tick.timestamp,
        visibleTimeSpanMs,
        boundary,
        locale,
        timezone,
        weekStart,
      }),
    };
  });
};

export { MS_DAY, MS_HOUR, MS_MINUTE, MS_MONTH, MS_WEEK, MS_YEAR };
