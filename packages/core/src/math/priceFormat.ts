import type { PriceDomain } from "../store/Store";

/** 格式化上下文：刻度 / 数值 */
export type PriceFormatKind = "tick" | "value";

export type PriceFormatContext = {
  kind: PriceFormatKind;
  /** 当前 nice tick step；仅 kind==='tick' 时有意义 */
  step?: number;
  /** 当前 price domain（可选，供高级自定义） */
  domain?: PriceDomain;
};

export type PriceFormatter = (
  value: number,
  ctx: PriceFormatContext,
) => string;

/** 内置价格格式 */
export type PriceFormatBuiltIn = {
  type: "price";
  /** 最小变动；省略时不约束 decimals / step 下界 */
  minMove?: number;
  /** 展示小数位；省略时由 minMove + step 推导 */
  precision?: number;
  /** 是否对极小数使用 0.0{n}xxx；默认 false */
  compactTiny?: boolean;
  /** 大数是否加千分位；默认 true */
  useGrouping?: boolean;
};

/** 完全自定义 */
export type PriceFormatCustom = {
  type: "custom";
  minMove?: number;
  formatter: PriceFormatter;
};

export type PriceFormat = PriceFormatBuiltIn | PriceFormatCustom;

export const DEFAULT_PRICE_FORMAT: PriceFormatBuiltIn = { type: "price" };

const COMPACT_TINY_LEADING_ZEROS_THRESHOLD = 4;
const VALUE_DECIMALS_MIN = 2;
const VALUE_DECIMALS_MAX = 8;

export const decimalsFromMinMove = (minMove: number): number => {
  if (!Number.isFinite(minMove) || minMove <= 0) return 0;
  return Math.max(0, -Math.floor(Math.log10(minMove) + 1e-12));
};

export const decimalsFromStep = (step: number): number => {
  if (!Number.isFinite(step) || step <= 0) return 0;
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-12));
};

/**
 * 无 step / minMove / precision 时，从数值本身推断有效小数位（2–8）。
 */
export const inferValueDecimals = (value: number): number => {
  if (!Number.isFinite(value) || value === 0) return VALUE_DECIMALS_MIN;

  const abs = Math.abs(value);
  const fixed = abs.toFixed(VALUE_DECIMALS_MAX);
  const dot = fixed.indexOf(".");
  if (dot < 0) return VALUE_DECIMALS_MIN;

  let end = fixed.length;
  while (end > dot + 1 && fixed[end - 1] === "0") end -= 1;
  const decimals = end - dot - 1;
  return Math.min(
    VALUE_DECIMALS_MAX,
    Math.max(VALUE_DECIMALS_MIN, decimals),
  );
};

export type CompactTinyOptions = {
  /** 有效数字位数，默认 4 */
  significantDigits?: number;
  /** 触发 compact 的最少前导零个数，默认 4 */
  minLeadingZeros?: number;
};

/**
 * 极小数 compact：`0.000000000532` → `0.0{9}532`
 * 不满足阈值时返回 null。
 */
export const formatCompactTiny = (
  value: number,
  options: CompactTinyOptions = {},
): string | null => {
  if (!Number.isFinite(value) || value === 0) return null;

  const significantDigits = options.significantDigits ?? 4;
  const minLeadingZeros =
    options.minLeadingZeros ?? COMPACT_TINY_LEADING_ZEROS_THRESHOLD;

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const leadingZeros = -Math.floor(Math.log10(abs)) - 1;
  if (leadingZeros < minLeadingZeros) return null;

  // 将数归一到 [1, 10)，再去掉小数点得到有效数字串：5.32 → "532"
  const mantissa = abs * 10 ** (leadingZeros + 1);
  const significand = mantissa
    .toFixed(Math.max(0, significantDigits - 1))
    .replace(".", "")
    .replace(/0+$/, "");

  if (!significand || significand === "0") return null;
  return `${sign}0.0{${leadingZeros}}${significand}`;
};

const withGrouping = (fixed: string): string => {
  const negative = fixed.startsWith("-");
  const body = negative ? fixed.slice(1) : fixed;
  const dot = body.indexOf(".");
  const intPart = dot >= 0 ? body.slice(0, dot) : body;
  const fracPart = dot >= 0 ? body.slice(dot + 1) : undefined;
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const joined = fracPart !== undefined ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${joined}` : joined;
};

const resolveDecimals = (
  value: number,
  ctx: PriceFormatContext,
  opts: PriceFormatBuiltIn,
): number => {
  const stepDecimals =
    ctx.step != null && Number.isFinite(ctx.step) && ctx.step > 0
      ? decimalsFromStep(ctx.step)
      : 0;
  const moveDecimals =
    opts.minMove != null ? decimalsFromMinMove(opts.minMove) : 0;
  const precisionDecimals = opts.precision ?? 0;

  const base = Math.max(stepDecimals, moveDecimals, precisionDecimals);
  if (base > 0) return base;
  if (ctx.kind === "tick" && ctx.step != null) return stepDecimals;
  return inferValueDecimals(value);
};

export const formatPrice = (
  value: number,
  ctx: PriceFormatContext,
  opts: PriceFormatBuiltIn = DEFAULT_PRICE_FORMAT,
): string => {
  if (!Number.isFinite(value)) return "--";

  const decimals = resolveDecimals(value, ctx, opts);

  if (opts.compactTiny) {
    const compact = formatCompactTiny(value, {
      significantDigits: Math.max(4, decimals),
    });
    if (compact) return compact;
  }

  const fixed = value.toFixed(decimals);
  return opts.useGrouping === false ? fixed : withGrouping(fixed);
};

/** 把配置变成统一 PriceFormatter */
export const createPriceFormatter = (
  format: PriceFormat = DEFAULT_PRICE_FORMAT,
): PriceFormatter => {
  if (format.type === "custom") {
    return format.formatter;
  }
  return (value, ctx) => formatPrice(value, ctx, format);
};

/** 适配旧版 `(n) => string` 调用点 */
export const asValueFormatter = (
  formatter: PriceFormatter,
): ((value: number) => string) => {
  return (value) => formatter(value, { kind: "value" });
};

/** 将简单 `(n) => string` 提升为 PriceFormatter（忽略 ctx） */
export const fromSimpleFormatter = (
  format: (value: number) => string,
): PriceFormatter => {
  return (value) => format(value);
};

export const getPriceFormatMinMove = (
  format: PriceFormat | undefined,
): number | undefined => format?.minMove;
