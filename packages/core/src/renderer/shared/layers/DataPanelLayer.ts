import type { ILayer } from "../../base/ILayer";
import type { DataPanelLayerData } from "./types";

const DEFAULT_FONT = "12px sans-serif";
const DEFAULT_PADDING_X = 8;
const DEFAULT_PADDING_Y = 6;
const DEFAULT_LINE_HEIGHT = 16;
const DEFAULT_ROW_PAD_X = 4;
const DEFAULT_ROW_PAD_Y = 2;

/** 主图 / 副图左上角信息面板 */
export class DataPanelLayer
  implements ILayer<CanvasRenderingContext2D, DataPanelLayerData | null>
{
  readonly id: string = "DataPanelLayer";
  readonly zIndex: number = 9;

  draw(
    ctx: CanvasRenderingContext2D,
    data: DataPanelLayerData | null,
  ): void {
    if (!data || data.rows.length === 0) return;

    const {
      viewportWidth,
      viewportHeight,
      rows,
      anchor = "top-left",
      paddingX = DEFAULT_PADDING_X,
      paddingY = DEFAULT_PADDING_Y,
      font = DEFAULT_FONT,
      rowBackground,
    } = data;

    if (viewportWidth <= 0 || viewportHeight <= 0) return;

    ctx.save();
    ctx.font = font;
    ctx.textBaseline = "top";

    let y = paddingY;

    for (const row of rows) {
      if (row.segments.length === 0) {
        y += DEFAULT_LINE_HEIGHT;
        continue;
      }

      let totalWidth = 0;
      const widths: number[] = [];
      for (const seg of row.segments) {
        const w = ctx.measureText(seg.text).width;
        widths.push(w);
        totalWidth += w;
      }

      const x0 =
        anchor === "top-right"
          ? viewportWidth - paddingX - totalWidth
          : paddingX;

      if (rowBackground) {
        ctx.fillStyle = rowBackground;
        ctx.fillRect(
          x0 - DEFAULT_ROW_PAD_X,
          y - DEFAULT_ROW_PAD_Y,
          totalWidth + DEFAULT_ROW_PAD_X * 2,
          DEFAULT_LINE_HEIGHT,
        );
      }

      let x = x0;
      for (let i = 0; i < row.segments.length; i++) {
        const seg = row.segments[i]!;
        ctx.fillStyle = seg.color;
        ctx.fillText(seg.text, x, y);
        x += widths[i]!;
      }

      y += DEFAULT_LINE_HEIGHT;
      if (y > viewportHeight) break;
    }

    ctx.restore();
  }
}
