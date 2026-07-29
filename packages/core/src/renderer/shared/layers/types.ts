import type { AxisTick } from "../../../math/priceViewport";
import type { TimeAxisTick } from "../../../math/timeAxis";
import type { IndexDomain, PriceDomain } from "../../../store/Store";

export type GridStyle = {
  color?: string;
  lineWidth?: number;
  dash?: number[];
};

export type HorizontalGridSection = {
  domain: PriceDomain;
  viewportHeight: number;
  ticks: AxisTick[];
};

export type VerticalGridSection = {
  indexDomain: IndexDomain;
  viewportWidth: number;
  ticks: TimeAxisTick[];
};

/**
 * 通用网格 Layer 数据。
 * horizontal / vertical 均为可选，各 Chart 按需组合（如 Volume 仅共享 vertical）。
 */
export type GridLayerData = {
  viewportWidth: number;
  viewportHeight: number;
  horizontal?: HorizontalGridSection;
  vertical?: VerticalGridSection;
  style?: GridStyle;
};

export type WithGridLayerData = {
  grid: GridLayerData;
};

export type CrosshairStyle = {
  color?: string;
  lineWidth?: number;
  dash?: number[];
};

export type CrosshairLayerData = {
  active: boolean;
  barIndex: number;
  x: number;
  y: number | null;
  viewportWidth: number;
  viewportHeight: number;
  showVertical: boolean;
  showHorizontal: boolean;
  style?: CrosshairStyle;
};

export type CrosshairYAxisLabelData = {
  y: number;
  label: string;
  axisWidth: number;
  background?: string;
  textColor?: string;
};

export type WithCrosshairLayerData = {
  crosshair: CrosshairLayerData | null;
};

export type WithCrosshairYAxisLabelData = {
  crosshairLabel: CrosshairYAxisLabelData | null;
};

/** 主图最新价横虚线 */
export type LivePriceLayerData = {
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  color: string;
};

export type WithLivePriceLayerData = {
  livePrice: LivePriceLayerData | null;
};

/** 主图 Y 轴最新价高亮标签 */
export type LivePriceYAxisLabelData = {
  y: number;
  label: string;
  axisWidth: number;
  /** 红底 / 绿底 */
  background: string;
};

export type WithLivePriceYAxisLabelData = {
  livePriceLabel: LivePriceYAxisLabelData | null;
};

export type XAxisCrosshairHighlight = {
  barIndex: number;
  label: string;
};

/** 信息层面板中的着色文本片段 */
export type DataPanelSegment = {
  text: string;
  color: string;
};

export type DataPanelRow = {
  segments: DataPanelSegment[];
};

export type DataPanelLayerData = {
  viewportWidth: number;
  viewportHeight: number;
  rows: DataPanelRow[];
  /** 默认 top-left */
  anchor?: "top-right" | "top-left";
  paddingX?: number;
  paddingY?: number;
  font?: string;
  /** 行背景（半透明，提升可读性） */
  rowBackground?: string;
};

export type WithDataPanelLayerData = {
  dataPanel: DataPanelLayerData | null;
};
