import type { ILayer } from "../../../base/ILayer";
import type { LivePriceLayerData } from "../../../shared/layers/types";

const DEFAULT_STYLE = {
  lineWidth: 1,
  dash: [4, 4] as number[],
};

/** 主图最新价横虚线层 */
export class LivePriceLayer
  implements ILayer<CanvasRenderingContext2D, LivePriceLayerData | null>
{
  readonly id: string = "LivePriceLayer";
  readonly zIndex: number = 5;

  draw(
    ctx: CanvasRenderingContext2D,
    data: LivePriceLayerData | null,
  ): void {
    if (!data) return;

    const { y, viewportWidth, viewportHeight, color } = data;
    if (viewportWidth <= 0 || viewportHeight <= 0) return;
    if (y < -0.5 || y > viewportHeight + 0.5) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = DEFAULT_STYLE.lineWidth;
    ctx.setLineDash(DEFAULT_STYLE.dash);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewportWidth, y);
    ctx.stroke();
    ctx.restore();
  }
}
