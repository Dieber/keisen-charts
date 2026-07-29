import type {
  IndicatorCalcParams,
  IndicatorDescriptor,
  IndicatorResult,
} from "../../indicators/types";
import type { LocaleMessages } from "../../locale/types";
import { zhCNLocale } from "../../locale/presets/zh-CN";
import { defaultFormatIndicator } from "../../math/indicatorViewport";
import { defaultFormatPrice } from "../../math/priceViewport";
import { defaultFormatVolume } from "../../math/volumeViewport";
import type { CrosshairState } from "../../store/Store";
import type { ResolvedThemeTokens, ThemeMode } from "../../theme/types";
import type { KlineBar } from "../../types/kline";
import {
  formatLegendValue,
  isLegendContributor,
  mergeLegendItems,
  type LegendItem,
} from "./legend";
import type {
  DataPanelLayerData,
  DataPanelRow,
  DataPanelSegment,
} from "./layers/types";

const rowBackgroundForMode = (mode: ThemeMode): string =>
  mode === "light" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.45)";

export const resolveDataPanelBarIndex = (
  crosshair: CrosshairState,
  klineLength: number,
): number => {
  if (crosshair != null) {
    return Math.max(0, Math.min(crosshair.barIndex, klineLength - 1));
  }
  if (klineLength > 0) return klineLength - 1;
  return -1;
};

const formatCalcParamsTitle = (params: IndicatorCalcParams): string => {
  if (Array.isArray(params)) {
    return params.filter((n) => Number.isFinite(n)).join(",");
  }
  const parts: string[] = [];
  for (const value of Object.values(params)) {
    if (Array.isArray(value)) {
      parts.push(...value.filter((n) => Number.isFinite(n)).map(String));
    } else if (typeof value === "number" && Number.isFinite(value)) {
      parts.push(String(value));
    }
  }
  return parts.join(",");
};

const buildOhlcRow = (
  bar: KlineBar,
  theme: ResolvedThemeTokens,
  formatPrice: (value: number) => string,
  messages: LocaleMessages,
): DataPanelRow => {
  const trendColor = bar.c >= bar.o ? theme.up : theme.down;
  const neutral = theme.axisText;

  const segments: DataPanelSegment[] = [
    { text: `${messages.open}${formatPrice(bar.o)}`, color: neutral },
    { text: `  ${messages.high}${formatPrice(bar.h)}`, color: neutral },
    { text: `  ${messages.low}${formatPrice(bar.l)}`, color: neutral },
    { text: `  ${messages.close}${formatPrice(bar.c)}`, color: trendColor },
    {
      text: `  ${messages.volume}${defaultFormatVolume(bar.v)}`,
      color: trendColor,
    },
  ];

  return { segments };
};

const collectLegendItems = (
  layers: readonly unknown[],
  barIndex: number,
  data: unknown,
): LegendItem[] => {
  const items: LegendItem[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!isLegendContributor(layer)) continue;
    const item = layer.getLegendItems(barIndex, data);
    if (!item) continue;
    items.push({
      ...item,
      order: i,
    });
  }
  return items;
};

type BuildMainOptions = {
  kline: KlineBar[];
  crosshair: CrosshairState;
  theme: ResolvedThemeTokens;
  mode: ThemeMode;
  viewportWidth: number;
  viewportHeight: number;
  layers: readonly unknown[];
  /** 传给 getLegendItems 的完整 render data */
  layerData: unknown;
  showDataPanel?: boolean;
  formatPrice?: (value: number) => string;
  /** 缺省 zh-CN，与零配置观感一致 */
  locale?: LocaleMessages;
};

export const buildMainDataPanelData = (
  options: BuildMainOptions,
): DataPanelLayerData | null => {
  const {
    kline,
    crosshair,
    theme,
    mode,
    viewportWidth,
    viewportHeight,
    layers,
    layerData,
    showDataPanel = true,
    formatPrice = defaultFormatPrice,
    locale = zhCNLocale.messages,
  } = options;

  if (!showDataPanel || kline.length === 0) return null;

  const barIndex = resolveDataPanelBarIndex(crosshair, kline.length);
  if (barIndex < 0) return null;

  const bar = kline[barIndex];
  if (!bar) return null;

  const rows: DataPanelRow[] = [buildOhlcRow(bar, theme, formatPrice, locale)];
  const legendItems = collectLegendItems(layers, barIndex, layerData);
  rows.push(...mergeLegendItems(legendItems, theme.axisText));

  return {
    viewportWidth,
    viewportHeight,
    rows,
    anchor: "top-left",
    rowBackground: rowBackgroundForMode(mode),
  };
};

type BuildIndicatorOptions = {
  kline: KlineBar[];
  crosshair: CrosshairState;
  theme: ResolvedThemeTokens;
  mode: ThemeMode;
  viewportWidth: number;
  viewportHeight: number;
  descriptor: IndicatorDescriptor;
  indicatorResult: IndicatorResult;
  calcParams: IndicatorCalcParams;
  showDataPanel?: boolean;
};

export const buildIndicatorDataPanelData = (
  options: BuildIndicatorOptions,
): DataPanelLayerData | null => {
  const {
    kline,
    crosshair,
    theme,
    mode,
    viewportWidth,
    viewportHeight,
    descriptor,
    indicatorResult,
    calcParams,
    showDataPanel = true,
  } = options;

  if (!showDataPanel || kline.length === 0) return null;

  const barIndex = resolveDataPanelBarIndex(crosshair, kline.length);
  if (barIndex < 0) return null;

  const bar = kline[barIndex];
  const figures =
    descriptor.regenerateFigures?.(calcParams) ?? descriptor.figures;
  const name = descriptor.shortName ?? descriptor.name;
  const paramsTitle = formatCalcParamsTitle(calcParams);
  const title =
    paramsTitle.length > 0 ? `${name}(${paramsTitle})` : name;

  const segments: DataPanelSegment[] = [
    { text: title, color: theme.axisText },
  ];

  for (const figure of figures) {
    const series = indicatorResult[figure.key];
    const raw = series?.[barIndex] ?? null;
    const label = figure.key.toUpperCase();
    let color = figure.style?.color ?? theme.axisText;

    if (figure.type === "bar" && bar) {
      const isUp = bar.c >= bar.o;
      color = isUp
        ? (figure.style?.colorUp ?? theme.up)
        : (figure.style?.colorDown ?? theme.down);
    }

    const formatValue = descriptor.formatTick ?? defaultFormatIndicator;
    segments.push({
      text: `  ${label}: ${formatLegendValue(raw, formatValue)}`,
      color,
    });
  }

  return {
    viewportWidth,
    viewportHeight,
    rows: [{ segments }],
    anchor: "top-left",
    rowBackground: rowBackgroundForMode(mode),
  };
};
