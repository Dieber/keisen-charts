import {
  defaultFormatPrice,
  priceToY,
  yToPrice,
} from "../../math/priceViewport";
import {
  defaultFormatIndicator,
  indicatorToY,
  yToIndicator,
} from "../../math/indicatorViewport";
import { indexToX } from "../../math/viewport";
import type {
  CrosshairSourceViewId,
  CrosshairState,
  IndexDomain,
  PriceDomain,
  UiState,
} from "../../store/Store";
import { getPane } from "../../store/Store";
import { getDateTimeParts } from "../../time/getDateTimeParts";
import type { KlineTimezonePreset } from "../../time/types";
import type { ResolvedThemeTokens } from "../../theme/types";
import type { KlineBar } from "../../types/kline";
import type {
  CrosshairLayerData,
  CrosshairStyle,
  CrosshairYAxisLabelData,
  XAxisCrosshairHighlight,
} from "./layers/types";

const formatCrosshairDateTime = (
  timestamp: number,
  timezone: KlineTimezonePreset = "local",
): string => {
  const parts = getDateTimeParts(timestamp, timezone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
};

export const buildMainKlineCrosshairLayerData = (
  crosshair: CrosshairState | undefined,
  ui: Pick<
    UiState,
    "indexDomain" | "priceDomain" | "viewportWidth" | "viewportHeight"
  >,
  kline: KlineBar[],
  viewportWidth = ui.viewportWidth,
  viewportHeight = ui.viewportHeight,
  style?: CrosshairStyle,
): CrosshairLayerData | null => {
  if (!crosshair || kline.length === 0) return null;

  const x = indexToX(crosshair.barIndex, ui.indexDomain, viewportWidth);

  let y: number | null = null;
  if (crosshair.sourceViewId === "main") {
    const price = yToPrice(crosshair.localY, ui.priceDomain, viewportHeight);
    y = priceToY(price, ui.priceDomain, viewportHeight);
  }

  return {
    active: true,
    barIndex: crosshair.barIndex,
    x,
    y,
    viewportWidth,
    viewportHeight,
    showVertical: true,
    showHorizontal: crosshair.sourceViewId === "main" && y !== null,
    style,
  };
};

export const buildPaneCrosshairLayerData = (
  crosshair: CrosshairState | undefined,
  ui: Pick<UiState, "indexDomain" | "viewportWidth" | "panes">,
  paneId: string,
  kline: KlineBar[],
  viewportWidth = ui.viewportWidth,
  viewportHeight?: number,
  style?: CrosshairStyle,
): CrosshairLayerData | null => {
  if (!crosshair || kline.length === 0) return null;

  const pane = getPane(ui as UiState, paneId);
  const height = viewportHeight ?? pane.viewportHeight;
  const x = indexToX(crosshair.barIndex, ui.indexDomain, viewportWidth);

  let y: number | null = null;
  if (crosshair.sourceViewId === paneId) {
    const value = yToIndicator(crosshair.localY, pane.domain, height);
    y = indicatorToY(value, pane.domain, height);
  }

  return {
    active: true,
    barIndex: crosshair.barIndex,
    x,
    y,
    viewportWidth,
    viewportHeight: height,
    showVertical: true,
    showHorizontal: crosshair.sourceViewId === paneId && y !== null,
    style,
  };
};

/** 通用 Y 轴十字线标签：domain + sourceViewId + formatter 即可复用 */
export const buildYAxisCrosshairLabel = (
  crosshair: CrosshairState | undefined,
  kline: KlineBar[],
  domain: PriceDomain,
  sourceViewId: CrosshairSourceViewId,
  formatLabel: (value: number) => string,
  axisWidth: number,
  viewportHeight: number,
  theme?: ResolvedThemeTokens,
): CrosshairYAxisLabelData | null => {
  if (!crosshair || kline.length === 0 || crosshair.sourceViewId !== sourceViewId) {
    return null;
  }

  const value = yToPrice(crosshair.localY, domain, viewportHeight);

  return {
    y: priceToY(value, domain, viewportHeight),
    label: formatLabel(value),
    axisWidth,
    background: theme?.crosshairLabelBg,
    textColor: theme?.crosshairLabelText,
  };
};

export const buildKlineYAxisCrosshairLabel = (
  crosshair: CrosshairState | undefined,
  ui: Pick<UiState, "priceDomain" | "viewportHeight">,
  kline: KlineBar[],
  axisWidth: number,
  viewportHeight = ui.viewportHeight,
  theme?: ResolvedThemeTokens,
): CrosshairYAxisLabelData | null =>
  buildYAxisCrosshairLabel(
    crosshair,
    kline,
    ui.priceDomain,
    "main",
    defaultFormatPrice,
    axisWidth,
    viewportHeight,
    theme,
  );

export const buildPaneYAxisCrosshairLabel = (
  crosshair: CrosshairState | undefined,
  ui: Pick<UiState, "panes">,
  paneId: string,
  kline: KlineBar[],
  axisWidth: number,
  formatLabel: (value: number) => string = defaultFormatIndicator,
  viewportHeight?: number,
  theme?: ResolvedThemeTokens,
): CrosshairYAxisLabelData | null => {
  const pane = getPane(ui as UiState, paneId);
  return buildYAxisCrosshairLabel(
    crosshair,
    kline,
    pane.domain,
    paneId,
    formatLabel,
    axisWidth,
    viewportHeight ?? pane.viewportHeight,
    theme,
  );
};

export const buildXAxisCrosshairHighlight = (
  crosshair: CrosshairState | undefined,
  _indexDomain: IndexDomain,
  _viewportWidth: number,
  kline: KlineBar[],
  timezone: KlineTimezonePreset = "local",
): XAxisCrosshairHighlight | null => {
  if (!crosshair || kline.length === 0) return null;

  const bar = kline[crosshair.barIndex];
  if (!bar) return null;

  return {
    barIndex: crosshair.barIndex,
    label: formatCrosshairDateTime(bar.t, timezone),
  };
};
