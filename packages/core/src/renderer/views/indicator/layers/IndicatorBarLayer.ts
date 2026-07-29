import type { ILayer } from "../../../base/ILayer";
import type { BarColorBy } from "../../../../indicators/types";
import { priceToY } from "../../../../math/priceViewport";
import {
  computeBarLayoutFromDomain,
  indexToX,
} from "../../../../math/viewport";
import type { IndicatorLayerData } from "../../../../types/kline";

export type IndicatorBarStyle = {
  colorUp?: string;
  colorDown?: string;
  zeroLineColor?: string;
  barColorBy?: BarColorBy;
  showZeroLine?: boolean;
};

const DEFAULT_ZERO_LINE = "rgba(120, 123, 134, 0.6)";

/** 通用指标柱图层（正负分色或 K 线涨跌色 + 可选零轴） */
export class IndicatorBarLayer
  implements ILayer<CanvasRenderingContext2D, IndicatorLayerData>
{
  readonly id: string;
  readonly zIndex: number = 1;

  private readonly resultKey: string;
  private readonly colorUp?: string;
  private readonly colorDown?: string;
  private readonly zeroLineColor: string;
  private readonly barColorBy: BarColorBy;
  private readonly showZeroLine: boolean;

  constructor(resultKey: string, style?: IndicatorBarStyle) {
    this.resultKey = resultKey;
    this.id = `IndicatorBarLayer-${resultKey}`;
    this.colorUp = style?.colorUp;
    this.colorDown = style?.colorDown;
    this.zeroLineColor = style?.zeroLineColor ?? DEFAULT_ZERO_LINE;
    this.barColorBy = style?.barColorBy ?? "valueSign";
    this.showZeroLine = style?.showZeroLine ?? true;
  }

  draw(ctx: CanvasRenderingContext2D, data: IndicatorLayerData): void {
    const series = data.indicatorResult[this.resultKey];
    if (!series || data.kline.length === 0) return;

    const { indexDomain, paneDomain, viewportWidth, viewportHeight } =
      data.viewport;
    const bar = computeBarLayoutFromDomain(indexDomain, viewportWidth);
    const startBar = Math.max(0, Math.floor(indexDomain.start));
    const endBar = Math.min(data.kline.length - 1, Math.ceil(indexDomain.end));
    const zeroY = priceToY(0, paneDomain, viewportHeight);
    const colorUp = this.colorUp ?? data.theme.up;
    const colorDown = this.colorDown ?? data.theme.down;

    ctx.save();

    if (this.showZeroLine) {
      ctx.strokeStyle = this.zeroLineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(viewportWidth, zeroY);
      ctx.stroke();
    }

    for (let barIndex = startBar; barIndex <= endBar; barIndex++) {
      const value = series[barIndex];
      if (value === null || value === undefined) continue;

      const x = indexToX(barIndex, indexDomain, viewportWidth);
      if (x + bar.width / 2 < 0 || x - bar.width / 2 > viewportWidth) continue;

      const topY = priceToY(value, paneDomain, viewportHeight);
      const y = Math.min(topY, zeroY);
      const height = Math.max(Math.abs(topY - zeroY), 1);

      if (this.barColorBy === "candle") {
        const candle = data.kline[barIndex];
        const isUp = candle ? candle.c >= candle.o : value >= 0;
        ctx.fillStyle = isUp ? colorUp : colorDown;
      } else {
        ctx.fillStyle = value >= 0 ? colorUp : colorDown;
      }
      ctx.fillRect(x - bar.width / 2, y, bar.width, height);
    }

    ctx.restore();
  }
}
