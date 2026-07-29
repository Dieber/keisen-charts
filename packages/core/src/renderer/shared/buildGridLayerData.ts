import { computeNiceTicks } from "../../math/priceViewport";
import { type PriceFormatter } from "../../math/priceFormat";
import { formatIndicatorTick } from "../../math/indicatorViewport";
import {
  computeTimeAxisTicks,
  type TimeAxisOptions,
} from "../../math/timeAxis";
import type { KlineBar } from "../../types/kline";
import type { IndexDomain, PriceDomain, UiState } from "../../store/Store";
import type { GridLayerData, GridStyle } from "./layers/types";

export type HorizontalGridInput = {
  domain: PriceDomain;
  viewportHeight: number;
  ticks?: import("../../math/priceViewport").AxisTick[];
  minPixelSpacing?: number;
  minMove?: number;
  formatLabel?: PriceFormatter;
};

export type VerticalGridInput = {
  indexDomain: IndexDomain;
  viewportWidth: number;
  kline: KlineBar[];
  ticks?: import("../../math/timeAxis").TimeAxisTick[];
  timeAxisOptions?: TimeAxisOptions;
};

export type BuildGridLayerDataInput = {
  viewportWidth: number;
  viewportHeight: number;
  horizontal?: HorizontalGridInput;
  vertical?: VerticalGridInput;
  style?: GridStyle;
};

/**
 * 通用网格数据构建：与对应轴 Layer 使用相同 tick 纯函数，保证对齐。
 */
export const buildGridLayerData = (
  input: BuildGridLayerDataInput,
): GridLayerData => {
  const { viewportWidth, viewportHeight, horizontal, vertical, style } = input;

  const data: GridLayerData = {
    viewportWidth,
    viewportHeight,
    style,
  };

  if (horizontal) {
    data.horizontal = {
      domain: horizontal.domain,
      viewportHeight: horizontal.viewportHeight,
      ticks:
        horizontal.ticks ??
        computeNiceTicks(horizontal.domain, horizontal.viewportHeight, {
          minPixelSpacing: horizontal.minPixelSpacing,
          minMove: horizontal.minMove,
          formatLabel: horizontal.formatLabel,
        }),
    };
  }

  if (vertical) {
    data.vertical = {
      indexDomain: vertical.indexDomain,
      viewportWidth: vertical.viewportWidth,
      ticks:
        vertical.ticks ??
        computeTimeAxisTicks(
          vertical.indexDomain,
          vertical.viewportWidth,
          vertical.kline,
          vertical.timeAxisOptions,
        ),
    };
  }

  return data;
};

export type MainKlineGridOptions = {
  timeAxisOptions?: TimeAxisOptions;
  style?: GridStyle;
  formatLabel?: PriceFormatter;
  minMove?: number;
};

/** 主 K 线图网格：价格横线 + 时间竖线 */
export const buildMainKlineGridLayerData = (
  ui: Pick<
    UiState,
    "indexDomain" | "priceDomain" | "viewportWidth" | "viewportHeight"
  >,
  kline: KlineBar[],
  options: MainKlineGridOptions = {},
): GridLayerData =>
  buildGridLayerData({
    viewportWidth: ui.viewportWidth,
    viewportHeight: ui.viewportHeight,
    horizontal: {
      domain: ui.priceDomain,
      viewportHeight: ui.viewportHeight,
      formatLabel: options.formatLabel,
      minMove: options.minMove,
    },
    vertical: {
      indexDomain: ui.indexDomain,
      viewportWidth: ui.viewportWidth,
      kline,
      timeAxisOptions: options.timeAxisOptions,
    },
    style: options.style,
  });

/** 副图网格：pane domain 横线 + 时间竖线 */
export const buildPaneGridLayerData = (
  ui: Pick<UiState, "indexDomain" | "viewportWidth" | "panes">,
  paneId: string,
  kline: KlineBar[],
  options?: {
    timeAxisOptions?: TimeAxisOptions;
    formatLabel?: PriceFormatter;
    viewportHeight?: number;
    style?: GridStyle;
  },
): GridLayerData => {
  const pane = ui.panes?.[paneId] ?? {
    domain: { min: 0, max: 1 },
    viewportHeight: 120,
    yAxisMode: "auto" as const,
  };
  const viewportHeight = options?.viewportHeight ?? pane.viewportHeight;

  return buildGridLayerData({
    viewportWidth: ui.viewportWidth,
    viewportHeight,
    horizontal: {
      domain: pane.domain,
      viewportHeight,
      formatLabel: options?.formatLabel ?? formatIndicatorTick,
    },
    vertical: {
      indexDomain: ui.indexDomain,
      viewportWidth: ui.viewportWidth,
      kline,
      timeAxisOptions: options?.timeAxisOptions,
    },
    style: options?.style,
  });
};
