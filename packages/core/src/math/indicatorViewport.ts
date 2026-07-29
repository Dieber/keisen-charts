import { decimalsFromStep, type PriceFormatter } from "./priceFormat";
import { priceToY, yToPrice } from "./priceViewport";

/** 指标值 ↔ canvas Y（与价格轴同一套映射） */
export const indicatorToY = priceToY;
export const yToIndicator = yToPrice;

/** 默认指标数值格式化 */
export const defaultFormatIndicator = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(2);
  if (abs >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
};

/** 指标刻度：有 step 时 step-aware，否则回退默认分桶 */
export const formatIndicatorTick: PriceFormatter = (value, ctx) => {
  if (ctx.step != null && Number.isFinite(ctx.step) && ctx.step > 0) {
    return value.toFixed(decimalsFromStep(ctx.step));
  }
  return defaultFormatIndicator(value);
};
