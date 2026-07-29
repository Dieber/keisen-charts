import type { ILayer } from "../../../base/ILayer";
import { indexToX } from "../../../../math/viewport";
import {
  computeTimeAxisTicks,
  type TimeAxisOptions,
} from "../../../../math/timeAxis";
import type { ResolvedThemeTokens } from "../../../../theme/types";
import type { KlineBar } from "../../../../types/kline";
import type { KlineXAxisLayerData } from "../../../../types/kline";
import type { IndexDomain } from "../../../../store/Store";

const DEFAULT_STYLE = {
  font: "12px sans-serif",
  tickHeight: 4,
  textPaddingTop: 14,
  labelPaddingX: 6,
  labelPaddingY: 3,
  labelBoxHeight: 18,
};

const HIGHLIGHT_TICK_HEIGHT = 8;

/** K 线 X 轴时间刻度层 */
export class KlineXAxisLayer
  implements ILayer<CanvasRenderingContext2D, KlineXAxisLayerData>
{
  readonly id: string = "KlineXAxisLayer";
  readonly zIndex: number = 1;

  draw(ctx: CanvasRenderingContext2D, data: KlineXAxisLayerData): void {
    const { viewport, ticks, crosshair, theme } = data;
    const { indexDomain, viewportWidth } = viewport;
    const highlightedBarIndex = crosshair?.barIndex;

    ctx.save();
    ctx.strokeStyle = theme.axisTick;
    ctx.fillStyle = theme.axisText;
    ctx.font = DEFAULT_STYLE.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(viewportWidth, 0);
    ctx.stroke();

    for (const tick of ticks) {
      if (tick.barIndex === highlightedBarIndex) continue;

      const x = indexToX(tick.barIndex, indexDomain, viewportWidth);
      if (x < -1 || x > viewportWidth + 1) continue;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, DEFAULT_STYLE.tickHeight);
      ctx.stroke();

      ctx.fillText(tick.label, x, DEFAULT_STYLE.textPaddingTop);
    }

    if (crosshair) {
      const x = indexToX(crosshair.barIndex, indexDomain, viewportWidth);
      if (x >= -1 && x <= viewportWidth + 1) {
        ctx.strokeStyle = theme.accent;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HIGHLIGHT_TICK_HEIGHT);
        ctx.stroke();

        const textWidth = ctx.measureText(crosshair.label).width;
        const boxWidth = textWidth + DEFAULT_STYLE.labelPaddingX * 2;
        const boxHeight = DEFAULT_STYLE.labelBoxHeight;
        const boxX = Math.max(
          0,
          Math.min(x - boxWidth / 2, viewportWidth - boxWidth),
        );
        const boxY = DEFAULT_STYLE.textPaddingTop - DEFAULT_STYLE.labelPaddingY;

        ctx.fillStyle = theme.crosshairLabelBg;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = theme.crosshairLabelText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(crosshair.label, boxX + boxWidth / 2, boxY + boxHeight / 2);
      }
    }

    ctx.restore();
  }
}

export const buildKlineXAxisLayerData = (
  indexDomain: IndexDomain,
  viewportWidth: number,
  kline: KlineBar[],
  axisHeight: number,
  theme: ResolvedThemeTokens,
  crosshair: KlineXAxisLayerData["crosshair"] = null,
  options?: TimeAxisOptions,
): KlineXAxisLayerData => ({
  viewport: {
    indexDomain,
    viewportWidth,
  },
  ticks: computeTimeAxisTicks(indexDomain, viewportWidth, kline, options),
  axisHeight,
  crosshair,
  theme,
});
