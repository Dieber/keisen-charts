import type { ILayer } from "../../base/ILayer";
import type { LivePriceYAxisLabelData } from "./types";

const DEFAULT_STYLE = {
  textColor: "#FFFFFF",
  font: "12px sans-serif",
  paddingX: 6,
  paddingY: 3,
  boxHeight: 18,
  boxX: 3,
};

/** 主图 Y 轴最新价高亮标签层（红/绿底白字） */
export class LivePriceYAxisLabelLayer
  implements ILayer<CanvasRenderingContext2D, LivePriceYAxisLabelData | null>
{
  readonly id: string = "LivePriceYAxisLabelLayer";
  readonly zIndex: number = 5;

  draw(
    ctx: CanvasRenderingContext2D,
    data: LivePriceYAxisLabelData | null,
  ): void {
    if (!data) return;

    const { y, label, axisWidth, background } = data;
    if (!label || axisWidth <= 0) return;

    ctx.save();
    ctx.font = DEFAULT_STYLE.font;
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + DEFAULT_STYLE.paddingX * 2;
    const boxY = y - DEFAULT_STYLE.boxHeight / 2;

    ctx.fillStyle = background;
    ctx.fillRect(DEFAULT_STYLE.boxX, boxY, boxWidth, DEFAULT_STYLE.boxHeight);

    ctx.fillStyle = DEFAULT_STYLE.textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, DEFAULT_STYLE.paddingX, y);

    ctx.restore();
  }
}
