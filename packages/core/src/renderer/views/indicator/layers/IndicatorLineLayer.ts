import type { ILayer } from "../../../base/ILayer";
import { priceToY } from "../../../../math/priceViewport";
import { indexToX } from "../../../../math/viewport";
import type { IndicatorLayerData } from "../../../../types/kline";

export type IndicatorLineStyle = {
  color?: string;
  lineWidth?: number;
};

const DEFAULT_COLOR = "#2196F3";

/** 通用指标折线层：读取 indicatorResult[key] */
export class IndicatorLineLayer
  implements ILayer<CanvasRenderingContext2D, IndicatorLayerData>
{
  readonly id: string;
  readonly zIndex: number = 2;

  private readonly resultKey: string;
  private readonly color: string;
  private readonly lineWidth: number;

  constructor(resultKey: string, style?: IndicatorLineStyle) {
    this.resultKey = resultKey;
    this.id = `IndicatorLineLayer-${resultKey}`;
    this.color = style?.color ?? DEFAULT_COLOR;
    this.lineWidth = style?.lineWidth ?? 1.5;
  }

  draw(ctx: CanvasRenderingContext2D, data: IndicatorLayerData): void {
    const series = data.indicatorResult[this.resultKey];
    if (!series || data.kline.length === 0) return;

    const { indexDomain, paneDomain, viewportWidth, viewportHeight } =
      data.viewport;
    const startBar = Math.max(0, Math.floor(indexDomain.start));
    const endBar = Math.min(data.kline.length - 1, Math.ceil(indexDomain.end));

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.setLineDash([]);
    ctx.beginPath();

    let started = false;
    for (let barIndex = startBar; barIndex <= endBar; barIndex++) {
      const value = series[barIndex];
      if (value === null || value === undefined) {
        started = false;
        continue;
      }

      const x = indexToX(barIndex, indexDomain, viewportWidth);
      const y = priceToY(value, paneDomain, viewportHeight);

      if (x + 1 < 0 || x - 1 > viewportWidth) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }
}
