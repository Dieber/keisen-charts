import type { IndexDomain, PriceDomain } from "../store/Store";
import type { ResolvedThemeTokens } from "../theme/types";

export type KlineBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

/** 与 TradingView ResolutionString 对齐的子集 */
export type Resolution =
  | `${number}`
  | "1D"
  | "1W"
  | "1M";

export type ChartDataMeta = {
  resolution?: Resolution;
  symbol?: string;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
};

export type ChartDataState = {
  kline: KlineBar[];
  meta?: ChartDataMeta;
};

export type KlineViewport = {
  indexDomain: IndexDomain;
  priceDomain: PriceDomain;
  viewportWidth: number;
  viewportHeight: number;
};

export type KlineLayerData = {
  kline: KlineBar[];
  bar: {
    width: number;
    spacing: number;
  };
  viewport: KlineViewport;
  theme: ResolvedThemeTokens;
  /** 主图价格格式化（OHLC / overlay legend） */
  formatPrice: (value: number) => string;
};

/** 通用 Y 轴视口（主图 / 成交量 / 指标副图共用） */
export type YAxisViewport = {
  domain: PriceDomain;
  viewportHeight: number;
};

export type YAxisLayerData = {
  viewport: YAxisViewport;
  ticks: import("../math/priceViewport").AxisTick[];
  axisWidth: number;
  crosshairLabel: import("../renderer/shared/layers/types").CrosshairYAxisLabelData | null;
  livePriceLabel: import("../renderer/shared/layers/types").LivePriceYAxisLabelData | null;
  theme: ResolvedThemeTokens;
};

export type KlineXAxisViewport = {
  indexDomain: IndexDomain;
  viewportWidth: number;
};

export type KlineXAxisLayerData = {
  viewport: KlineXAxisViewport;
  ticks: import("../math/timeAxis").TimeAxisTick[];
  axisHeight: number;
  crosshair: import("../renderer/shared/layers/types").XAxisCrosshairHighlight | null;
  theme: ResolvedThemeTokens;
};

export type MainKlineViewRenderData = KlineLayerData &
  import("../renderer/shared/layers/types").WithGridLayerData &
  import("../renderer/shared/layers/types").WithCrosshairLayerData &
  import("../renderer/shared/layers/types").WithLivePriceLayerData &
  import("../renderer/shared/layers/types").WithDataPanelLayerData;

/** 通用指标副图视口 */
export type IndicatorViewport = {
  indexDomain: IndexDomain;
  paneDomain: PriceDomain;
  viewportWidth: number;
  viewportHeight: number;
};

export type IndicatorLayerData = {
  kline: KlineBar[];
  bar: {
    width: number;
    spacing: number;
  };
  viewport: IndicatorViewport;
  /** View 级一次 calc 的列式结果 */
  indicatorResult: Record<string, (number | null)[]>;
  calcParams: Record<string, number | number[]> | number[];
  theme: ResolvedThemeTokens;
};

export type MainIndicatorViewRenderData = IndicatorLayerData &
  import("../renderer/shared/layers/types").WithGridLayerData &
  import("../renderer/shared/layers/types").WithCrosshairLayerData &
  import("../renderer/shared/layers/types").WithDataPanelLayerData;
