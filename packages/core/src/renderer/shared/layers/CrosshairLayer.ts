import type { ILayer } from "../../base/ILayer";
import type { CrosshairLayerData } from "./types";

const DEFAULT_STYLE = {
  color: "#758696",
  lineWidth: 1,
  dash: [4, 4],
};

/** 通用十字线层：竖线 / 横线可按需显隐 */
export class CrosshairLayer
  implements ILayer<CanvasRenderingContext2D, CrosshairLayerData | null>
{
  readonly id: string = "CrosshairLayer";
  readonly zIndex: number = 10;

  draw(
    ctx: CanvasRenderingContext2D,
    data: CrosshairLayerData | null,
  ): void {
    if (!data?.active) return;

    const {
      x,
      y,
      viewportWidth,
      viewportHeight,
      showVertical,
      showHorizontal,
      style,
    } = data;

    if (viewportWidth <= 0 || viewportHeight <= 0) return;

    ctx.save();
    ctx.strokeStyle = style?.color ?? DEFAULT_STYLE.color;
    ctx.lineWidth = style?.lineWidth ?? DEFAULT_STYLE.lineWidth;
    ctx.setLineDash(style?.dash ?? DEFAULT_STYLE.dash);

    if (showVertical && x >= -0.5 && x <= viewportWidth + 0.5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewportHeight);
      ctx.stroke();
    }

    if (
      showHorizontal &&
      y !== null &&
      y >= -0.5 &&
      y <= viewportHeight + 0.5
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewportWidth, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
