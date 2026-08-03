import {
  createPriceFormatter,
  formatCompactTiny,
  type KlineTimezone,
  type PriceFormat,
  type Resolution,
} from "@keisen-charts/vue";

export const SYMBOL_OPTIONS = [
  { label: "XRP", value: "XRPUSDT" },
  { label: "BTC", value: "BTCUSDT" },
] as const;

export type SymbolId = (typeof SYMBOL_OPTIONS)[number]["value"];

export type ThemeId = "default" | "neon";

export const SYMBOL_PRICE_FORMAT: Record<SymbolId, PriceFormat> = {
  XRPUSDT: {
    type: "price",
    minMove: 0.0001,
    precision: 4,
    useGrouping: false,
  },
  BTCUSDT: {
    type: "price",
    minMove: 0.1,
    precision: 1,
  },
};

/** demo：极小数 compact（0.0{n}xxx）；默认关闭，按需切换 */
export const COMPACT_DEMO_FORMAT: PriceFormat = {
  type: "custom",
  minMove: 1e-12,
  formatter: (value, ctx) =>
    formatCompactTiny(value, { significantDigits: 4 }) ??
    createPriceFormatter({
      type: "price",
      precision: 12,
      useGrouping: false,
    })(value, ctx),
};

export const RESOLUTION_OPTIONS: { label: string; value: Resolution }[] = [
  { label: "1s", value: "1S" },
  { label: "1m", value: "1" },
  { label: "3m", value: "3" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h", value: "60" },
  { label: "2h", value: "120" },
  { label: "4h", value: "240" },
  { label: "6h", value: "360" },
  { label: "12h", value: "720" },
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
];

export const THEME_OPTIONS: { label: string; value: ThemeId }[] = [
  { label: "Default", value: "default" },
  { label: "Neon", value: "neon" },
];

export const TIMEZONE_OPTIONS: { label: string; value: KlineTimezone }[] = [
  { label: "UTC", value: "UTC" },
  { label: "Local", value: "local" },
];

export const LOCALE_OPTIONS = [
  { label: "中文", value: "zh-CN" },
  { label: "EN", value: "en-US" },
];
