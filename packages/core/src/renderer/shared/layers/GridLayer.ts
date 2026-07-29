import type { ILayer } from "../../base/ILayer";
import { priceToY } from "../../../math/priceViewport";
import { indexToX } from "../../../math/viewport";
import type { GridLayerData } from "./types";

const DEFAULT_STYLE = {
  color: "#bbbbbb",
  lineWidth: 1,
  dash: [2, 2],
};

/** 通用网格层：按 horizontal / vertical tick 绘制横线与竖线 */
export class GridLayer implements ILayer<CanvasRenderingContext2D, GridLayerData> {
  readonly id: string = "GridLayer";
  readonly zIndex: number = 0;

  draw(ctx: CanvasRenderingContext2D, data: GridLayerData): void {
    const { viewportWidth, viewportHeight, horizontal, vertical, style } = data;
    if (viewportWidth <= 0 || viewportHeight <= 0) return;
    if (!horizontal && !vertical) return;

    ctx.save();
    ctx.strokeStyle = style?.color ?? DEFAULT_STYLE.color;
    ctx.lineWidth = style?.lineWidth ?? DEFAULT_STYLE.lineWidth;
    ctx.setLineDash(style?.dash ?? DEFAULT_STYLE.dash);

    if (horizontal) {
      const { domain, viewportHeight: sectionHeight, ticks } = horizontal;
      for (const tick of ticks) {
        const y = priceToY(tick.value, domain, sectionHeight);
        if (y < -0.5 || y > viewportHeight + 0.5) continue;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(viewportWidth, y);
        ctx.stroke();
      }
    }

    if (vertical) {
      const { indexDomain, viewportWidth: sectionWidth, ticks } = vertical;
      for (const tick of ticks) {
        const x = indexToX(tick.barIndex, indexDomain, sectionWidth);
        if (x < -0.5 || x > viewportWidth + 0.5) continue;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, viewportHeight);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
