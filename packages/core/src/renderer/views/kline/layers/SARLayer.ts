import type { ILayer } from "../../../base/ILayer";
import { computeSAR } from "../../../../indicators/indicators";
import { priceToY } from "../../../../math/priceViewport";
import { indexToX } from "../../../../math/viewport";
import type { LegendItem } from "../../../shared/legend";
import { formatLegendValue } from "../../../shared/legend";
import type { KlineBar, KlineLayerData } from "../../../../types/kline";
import { collectSeriesVisiblePrices } from "./visiblePriceExtent";

const DEFAULT_COLOR = "#FFEB3B";
const DOT_RADIUS = 2;

export class SARLayer implements ILayer<CanvasRenderingContext2D, KlineLayerData> {
  readonly id: string;
  readonly zIndex: number = 2;

  private readonly start: number;
  private readonly step: number;
  private readonly max: number;
  private readonly color: string;

  constructor(
    start: number = 2,
    step: number = 2,
    max: number = 20,
    color?: string,
  ) {
    this.start = start;
    this.step = step;
    this.max = max;
    this.id = `SARLayer-${start}-${step}-${max}`;
    this.color = color ?? DEFAULT_COLOR;
  }

  getLegendItems(barIndex: number, data: unknown): LegendItem | null {
    const layerData = data as KlineLayerData;
    const { kline } = layerData;
    if (kline.length === 0) return null;

    const sar = computeSAR(kline, this.start, this.step, this.max);
    const value = sar[barIndex] ?? null;

    return {
      groupId: "SAR",
      groupLabel: "SAR",
      paramLabel: `${this.start},${this.step},${this.max}`,
      order: 0,
      segments: [
        {
          text: `SAR: ${formatLegendValue(value, layerData.formatPrice)}`,
          color: this.color,
        },
      ],
    };
  }

  collectVisiblePrices(
    kline: KlineBar[],
    startBar: number,
    endBar: number,
  ): (number | null)[] {
    if (kline.length === 0) return [];
    return collectSeriesVisiblePrices(
      computeSAR(kline, this.start, this.step, this.max),
      startBar,
      endBar,
    );
  }

  draw(ctx: CanvasRenderingContext2D, data: KlineLayerData): void {
    const { kline, viewport } = data;
    if (kline.length === 0) return;

    const { indexDomain, priceDomain, viewportWidth, viewportHeight } = viewport;
    const sar = computeSAR(kline, this.start, this.step, this.max);

    const startBar = Math.max(0, Math.floor(indexDomain.start));
    const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));

    ctx.save();
    ctx.fillStyle = this.color;

    for (let barIndex = startBar; barIndex <= endBar; barIndex++) {
      const value = sar[barIndex];
      if (value === null) continue;

      const x = indexToX(barIndex, indexDomain, viewportWidth);
      const y = priceToY(value, priceDomain, viewportHeight);

      if (x + DOT_RADIUS < 0 || x - DOT_RADIUS > viewportWidth) continue;

      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
