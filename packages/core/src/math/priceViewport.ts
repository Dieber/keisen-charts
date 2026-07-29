import type { KlineBar } from "../types/kline";
import type { PriceDomain } from "../store/Store";
import {
  createPriceFormatter,
  type PriceFormatter,
} from "./priceFormat";

export const DEFAULT_VERTICAL_PADDING_RATIO = 0.1;

/** Y 轴刻度最小像素间距，控制密度（类似 TradingView） */
export const DEFAULT_MIN_TICK_PIXEL_SPACING = 40;

export const MIN_PRICE_RANGE = 1e-8;

const defaultPriceFormatter = createPriceFormatter({ type: "price" });

export const getPriceRange = (domain: PriceDomain): number =>
  domain.max - domain.min;

export const priceToY = (
  price: number,
  domain: PriceDomain,
  viewportHeight: number,
): number => {
  const range = getPriceRange(domain) || 1;
  return ((domain.max - price) / range) * viewportHeight;
};

export const yToPrice = (
  y: number,
  domain: PriceDomain,
  viewportHeight: number,
): number => {
  const range = getPriceRange(domain) || 1;
  return domain.max - (y / viewportHeight) * range;
};

export const computeAutoPriceDomain = (
  bars: KlineBar[],
  paddingRatio = DEFAULT_VERTICAL_PADDING_RATIO,
): PriceDomain => {
  if (bars.length === 0) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...bars.map((bar) => bar.l));
  const max = Math.max(...bars.map((bar) => bar.h));
  const range = max - min || 1;
  const padding = range * paddingRatio;

  return {
    min: min - padding,
    max: max + padding,
  };
};

export const panPriceDomain = (
  domain: PriceDomain,
  priceDelta: number,
): PriceDomain => ({
  min: domain.min + priceDelta,
  max: domain.max + priceDelta,
});

export const zoomPriceDomain = (
  domain: PriceDomain,
  anchorPrice: number,
  factor: number,
): PriceDomain => {
  const range = getPriceRange(domain) || 1;
  const nextRange = Math.max(range * factor, MIN_PRICE_RANGE);
  const anchorRatio = (anchorPrice - domain.min) / range;
  const nextMin = anchorPrice - anchorRatio * nextRange;

  return {
    min: nextMin,
    max: nextMin + nextRange,
  };
};

export type AxisTick = {
  value: number;
  label: string;
};

export type NiceTicksOptions = {
  minPixelSpacing?: number;
  /** 显式传入时约束 step 下界并对齐倍数 */
  minMove?: number;
  formatLabel?: PriceFormatter;
};

/** 默认价格格式化（委托 priceFormat，value 模式） */
export const defaultFormatPrice = (price: number): string =>
  defaultPriceFormatter(price, { kind: "value" });

const niceNumber = (value: number, round: boolean): number => {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
};

const alignStepToMinMove = (step: number, minMove: number): number => {
  if (!Number.isFinite(minMove) || minMove <= 0) return step;
  const units = Math.max(1, Math.round(step / minMove));
  return units * minMove;
};

/**
 * 根据视口高度与最小像素间距，计算合理的 nice tick 列表。
 */
export const computeNiceTicks = (
  domain: PriceDomain,
  viewportHeight: number,
  options: NiceTicksOptions = {},
): AxisTick[] => {
  const range = getPriceRange(domain);
  if (range <= 0 || viewportHeight <= 0) return [];

  const minPixelSpacing =
    options.minPixelSpacing ?? DEFAULT_MIN_TICK_PIXEL_SPACING;
  const formatLabel = options.formatLabel ?? defaultPriceFormatter;

  const maxTickCount = Math.max(2, Math.floor(viewportHeight / minPixelSpacing));
  const roughStep = range / maxTickCount;
  let step = niceNumber(roughStep, true);
  if (options.minMove != null) {
    step = Math.max(step, options.minMove);
    step = alignStepToMinMove(step, options.minMove);
  }
  if (step <= 0) return [];

  const firstIndex = Math.ceil(domain.min / step - 1e-12);
  const lastIndex = Math.floor(domain.max / step + 1e-12);
  const ticks: AxisTick[] = [];

  for (let i = firstIndex; i <= lastIndex; i += 1) {
    const value = i * step;
    ticks.push({
      value,
      label: formatLabel(value, { kind: "tick", step, domain }),
    });
  }

  return ticks;
};

export const measureMaxLabelWidth = (
  ctx: CanvasRenderingContext2D,
  ticks: AxisTick[],
  font = "12px sans-serif",
): number => {
  if (ticks.length === 0) return 0;

  ctx.save();
  ctx.font = font;
  const maxWidth = ticks.reduce(
    (max, tick) => Math.max(max, ctx.measureText(tick.label).width),
    0,
  );
  ctx.restore();

  return maxWidth;
};

export const measureYAxisWidth = (
  ctx: CanvasRenderingContext2D,
  ticks: AxisTick[],
  padding = 16,
  font = "12px sans-serif",
): number => Math.ceil(measureMaxLabelWidth(ctx, ticks, font) + padding);
