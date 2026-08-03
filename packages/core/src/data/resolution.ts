import type { Resolution } from "../types/kline";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const SECONDS_RESOLUTION_RE = /^(\d+)S$/;

export const resolutionToSeconds = (resolution: Resolution): number => {
  const secondsMatch = SECONDS_RESOLUTION_RE.exec(resolution);
  if (secondsMatch) {
    const seconds = Number(secondsMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) return seconds;
  }

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

export const resolutionToTimeFrame = (resolution: Resolution): string => {
  const secondsMatch = SECONDS_RESOLUTION_RE.exec(resolution);
  if (secondsMatch) return `${secondsMatch[1]}s`;

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
