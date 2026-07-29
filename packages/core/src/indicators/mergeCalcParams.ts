import type { IndicatorCalcParams } from "./types";

export const mergeCalcParams = (
  defaults: IndicatorCalcParams,
  props: Record<string, unknown>,
): IndicatorCalcParams => {
  if (Array.isArray(defaults)) {
    if (Array.isArray(props.calcParams)) {
      return props.calcParams as number[];
    }
    return defaults;
  }

  const next: Record<string, number | number[]> = { ...defaults };
  for (const [key, value] of Object.entries(props)) {
    if (
      key === "children" ||
      key === "key" ||
      key === "ref"
    ) {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = value;
    } else if (
      Array.isArray(value) &&
      value.every((v) => typeof v === "number")
    ) {
      next[key] = value as number[];
    }
  }
  return next;
};
