import { xToIndex } from "./viewport";
import type { IndexDomain } from "../store/Store";

export const snapBarIndex = (
  x: number,
  indexDomain: IndexDomain,
  viewportWidth: number,
  klineLength: number,
): number => {
  if (klineLength <= 0) return 0;
  const rawIndex = xToIndex(x, indexDomain, viewportWidth);
  const rounded = Math.round(rawIndex);
  return Math.max(0, Math.min(klineLength - 1, rounded));
};
