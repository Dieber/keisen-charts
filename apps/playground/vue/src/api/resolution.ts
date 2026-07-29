import type { Resolution } from "@keisen-charts/vue";
import { resolutionToSeconds } from "@keisen-charts/vue";

export { resolutionToSeconds };

export const resolutionToKtxTimeFrame = (resolution: Resolution): string => {
  if (resolution === "1D") return "1d";
  if (resolution === "1W") return "1w";
  if (resolution === "1M") return "1M";

  const minutes = Number(resolution);
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }
  return `${minutes}m`;
};

export const getDynamicLimit = (
  resolution: Resolution,
  from: number,
  to: number,
): number => {
  const intervalSeconds = resolutionToSeconds(resolution);
  const timeRangeSeconds = to - from;

  let limit = Math.ceil(timeRangeSeconds / intervalSeconds);
  limit = Math.ceil(limit * 1.1);

  const MIN_LIMIT = 10;
  const MAX_LIMIT = 1000;

  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, limit)) + 2;
};
