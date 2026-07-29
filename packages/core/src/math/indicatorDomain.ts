import type { PriceDomain } from "../store/Store";
import { DEFAULT_VERTICAL_PADDING_RATIO } from "./priceViewport";

export type AutoIndicatorDomainOptions = {
  paddingRatio?: number;
  includeZero?: boolean;
  /** min 固定为 0，只对 max 做 padding（成交量等非负序列） */
  fromZero?: boolean;
  fixed?: { min: number; max: number };
};

/**
 * 根据可见区间内的指标数值计算 auto Y 域。
 */
export const computeAutoIndicatorDomain = (
  values: Iterable<number | null | undefined>,
  options: AutoIndicatorDomainOptions = {},
): PriceDomain => {
  if (options.fixed) {
    return { ...options.fixed };
  }

  const paddingRatio =
    options.paddingRatio ?? DEFAULT_VERTICAL_PADDING_RATIO;
  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      continue;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    if (options.fromZero) return { min: 0, max: 1 };
    return options.includeZero ? { min: -1, max: 1 } : { min: 0, max: 1 };
  }

  if (options.fromZero) {
    const padding = Math.max(max, 0) * paddingRatio;
    return {
      min: 0,
      max: Math.max(max, 0) + padding || 1,
    };
  }

  if (options.includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  const range = max - min || 1;
  const padding = range * paddingRatio;

  return {
    min: min - padding,
    max: max + padding,
  };
};

/** 收集 indicator 结果中指定 keys 在 [start,end] 的值 */
export const collectIndicatorVisibleValues = (
  result: Record<string, (number | null)[]>,
  keys: string[],
  startBar: number,
  endBar: number,
): (number | null)[] => {
  const values: (number | null)[] = [];
  for (const key of keys) {
    const series = result[key];
    if (!series) continue;
    for (let i = startBar; i <= endBar; i++) {
      values.push(series[i] ?? null);
    }
  }
  return values;
};
