import type { ILayer } from "../../base/ILayer";
import type { PriceFormatter } from "../../../math/priceFormat";
import {
  computeNiceTicks,
  priceToY,
} from "../../../math/priceViewport";
import type { PriceDomain } from "../../../store/Store";
import type { ResolvedThemeTokens } from "../../../theme/types";
import type { YAxisLayerData } from "../../../types/kline";
import type {
  CrosshairYAxisLabelData,
  LivePriceYAxisLabelData,
} from "./types";

const DEFAULT_STYLE = {
  font: "12px sans-serif",
  textPaddingRight: 8,
};

/** 通用 Y 轴刻度层（主图 / 成交量 / 指标副图共用） */
export class YAxisLayer
  implements ILayer<CanvasRenderingContext2D, YAxisLayerData>
{
  readonly id: string = "YAxisLayer";
  readonly zIndex: number = 1;

  draw(ctx: CanvasRenderingContext2D, data: YAxisLayerData): void {
    const { viewport, ticks, theme } = data;
    const { domain, viewportHeight } = viewport;

    ctx.save();
    ctx.strokeStyle = theme.axisTick;
    ctx.fillStyle = theme.axisText;
    ctx.font = DEFAULT_STYLE.font;
    ctx.textBaseline = "middle";

    for (const tick of ticks) {
      const y = priceToY(tick.value, domain, viewportHeight);
      if (y < -1 || y > viewportHeight + 1) continue;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(3, y);
      ctx.stroke();

      ctx.fillText(tick.label, 10, y);
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, viewportHeight);
    ctx.stroke();
    ctx.restore();
  }
}

export const buildYAxisLayerData = (
  domain: PriceDomain,
  viewportHeight: number,
  axisWidth: number,
  formatTick: PriceFormatter,
  theme: ResolvedThemeTokens,
  crosshairLabel: CrosshairYAxisLabelData | null = null,
  livePriceLabel: LivePriceYAxisLabelData | null = null,
  minMove?: number,
): YAxisLayerData => ({
  viewport: {
    domain,
    viewportHeight,
  },
  ticks: computeNiceTicks(domain, viewportHeight, {
    formatLabel: formatTick,
    minMove,
  }),
  axisWidth,
  crosshairLabel,
  livePriceLabel,
  theme,
});
