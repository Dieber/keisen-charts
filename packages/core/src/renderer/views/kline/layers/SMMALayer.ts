import type { ILayer } from "../../../base/ILayer";
import { computeSMMA } from "../../../../indicators/indicators";
import type { LegendItem } from "../../../shared/legend";
import { formatLegendValue } from "../../../shared/legend";
import type { KlineBar, KlineLayerData } from "../../../../types/kline";
import { drawSeriesLine } from "./drawSeriesLine";
import { collectSeriesVisiblePrices } from "./visiblePriceExtent";

const DEFAULT_COLOR = "#00BCD4";

export class SMMALayer implements ILayer<CanvasRenderingContext2D, KlineLayerData> {
  readonly id: string;
  readonly zIndex: number = 2;

  private readonly period: number;
  private readonly color: string;

  constructor(period: number, color?: string) {
    this.period = period;
    this.id = `SMMALayer-${period}`;
    this.color = color ?? DEFAULT_COLOR;
  }

  getLegendItems(barIndex: number, data: unknown): LegendItem | null {
    const layerData = data as KlineLayerData;
    const { kline } = layerData;
    if (kline.length === 0 || this.period <= 0) return null;

    const smma = computeSMMA(kline, this.period);
    const value = smma[barIndex] ?? null;

    return {
      groupId: "SMMA",
      groupLabel: "SMMA",
      paramLabel: String(this.period),
      sortKey: this.period,
      order: 0,
      segments: [
        {
          text: `SMMA${this.period}: ${formatLegendValue(value, layerData.formatPrice)}`,
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
    if (kline.length === 0 || this.period <= 0) return [];
    return collectSeriesVisiblePrices(
      computeSMMA(kline, this.period),
      startBar,
      endBar,
    );
  }

  draw(ctx: CanvasRenderingContext2D, data: KlineLayerData): void {
    const { kline } = data;
    if (kline.length === 0 || this.period <= 0) return;

    const smma = computeSMMA(kline, this.period);
    drawSeriesLine(ctx, smma, data, { color: this.color });
  }
}
