import type { Resolution } from "../types/kline";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export const resolutionToSeconds = (resolution: Resolution): number => {
  if (resolution === "1D") return DAY;
  if (resolution === "1W") return WEEK;
  if (resolution === "1M") return 30 * DAY;

  const minutes = Number(resolution);
  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes * MINUTE;
  }

  return MINUTE;
};

export const resolutionToMs = (resolution: Resolution): number =>
  resolutionToSeconds(resolution) * 1000;

/** KTX time_frame */
export const resolutionToTimeFrame = (resolution: Resolution): string => {
  if (resolution === "1D") return "1d";
  if (resolution === "1W") return "1w";
  if (resolution === "1M") return "1M";

  const minutes = Number(resolution);
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }
  return `${minutes}m`;
};

export const buildCacheKey = (resolution: Resolution, symbol?: string): string =>
  `${symbol ?? "_"}:${resolution}`;
