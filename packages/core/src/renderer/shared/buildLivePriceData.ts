import { defaultFormatPrice, priceToY } from "../../math/priceViewport";
import type { PriceDomain } from "../../store/Store";
import type { ResolvedThemeTokens } from "../../theme/types";
import type { KlineBar } from "../../types/kline";
import type {
  LivePriceLayerData,
  LivePriceYAxisLabelData,
} from "./layers/types";

const livePriceColor = (
  bar: KlineBar,
  theme: ResolvedThemeTokens,
): string => (bar.c < bar.o ? theme.down : theme.up);

/** 主图画布：最新价横虚线数据 */
export const buildLivePriceLayerData = (
  kline: KlineBar[],
  priceDomain: PriceDomain,
  viewportWidth: number,
  viewportHeight: number,
  theme: ResolvedThemeTokens,
): LivePriceLayerData | null => {
  if (kline.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const last = kline[kline.length - 1]!;
  return {
    y: priceToY(last.c, priceDomain, viewportHeight),
    viewportWidth,
    viewportHeight,
    color: livePriceColor(last, theme),
  };
};

/** 主图 Y 轴：最新价高亮标签数据 */
export const buildLivePriceYAxisLabel = (
  kline: KlineBar[],
  priceDomain: PriceDomain,
  axisWidth: number,
  viewportHeight: number,
  theme: ResolvedThemeTokens,
  formatLabel: (value: number) => string = defaultFormatPrice,
): LivePriceYAxisLabelData | null => {
  if (kline.length === 0 || axisWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const last = kline[kline.length - 1]!;
  return {
    y: priceToY(last.c, priceDomain, viewportHeight),
    label: formatLabel(last.c),
    axisWidth,
    background: livePriceColor(last, theme),
  };
};
