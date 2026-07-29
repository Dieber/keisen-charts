import type { ILayer } from "../../base/ILayer";
import type { CrosshairYAxisLabelData } from "./types";

const DEFAULT_STYLE = {
  background: "#2962FF",
  textColor: "#FFFFFF",
  font: "12px sans-serif",
  paddingX: 6,
  paddingY: 3,
};

/** Y 轴十字线高亮标签层 */
export class CrosshairYAxisLabelLayer
  implements ILayer<CanvasRenderingContext2D, CrosshairYAxisLabelData | null>
{
  readonly id: string = "CrosshairYAxisLabelLayer";
  readonly zIndex: number = 10;

  draw(
    ctx: CanvasRenderingContext2D,
    data: CrosshairYAxisLabelData | null,
  ): void {
    if (!data) return;

    const { y, label, axisWidth } = data;
    if (!label || axisWidth <= 0) return;

    ctx.save();
    ctx.font = DEFAULT_STYLE.font;
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + DEFAULT_STYLE.paddingX * 2;
    const boxHeight = 18;
    const boxX = 3;
    const boxY = y - boxHeight / 2;

    ctx.fillStyle = data.background ?? DEFAULT_STYLE.background;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = data.textColor ?? DEFAULT_STYLE.textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, DEFAULT_STYLE.paddingX, y);

    ctx.restore();
  }
}
