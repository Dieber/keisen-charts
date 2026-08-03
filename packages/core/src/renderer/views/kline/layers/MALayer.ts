import type { ILayer } from "../../../base/ILayer";
import { computeSMA } from "../../../../indicators/indicators";
import type { LegendItem } from "../../../shared/legend";
import { formatLegendValue } from "../../../shared/legend";
import type { KlineBar, KlineLayerData } from "../../../../types/kline";
import { drawSeriesLine } from "./drawSeriesLine";
import { collectSeriesVisiblePrices } from "./visiblePriceExtent";

const DEFAULT_COLORS: Record<number, string> = {
  5: "#2196F3",
  10: "#FF9800",
};

const getDefaultColor = (period: number): string =>
  DEFAULT_COLORS[period] ?? "#9C27B0";

export class MALayer implements ILayer<CanvasRenderingContext2D, KlineLayerData> {
  readonly id: string;
  readonly zIndex: number = 2;

  private readonly period: number;
  private readonly color: string;

  constructor(period: number, color?: string) {
    this.period = period;
    this.id = `MALayer-${period}`;
    this.color = color ?? getDefaultColor(period);
  }

  getLegendItems(barIndex: number, data: unknown): LegendItem | null {
    const layerData = data as KlineLayerData;
    const { kline } = layerData;
    if (kline.length === 0 || this.period <= 0) return null;

    const sma = computeSMA(kline, this.period);
    const value = sma[barIndex] ?? null;

    return {
      groupId: "MA",
      groupLabel: "MA",
      paramLabel: String(this.period),
      sortKey: this.period,
      order: 0,
      segments: [
        {
          text: `MA${this.period}: ${formatLegendValue(value, layerData.formatPrice)}`,
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
      computeSMA(kline, this.period),
      startBar,
      endBar,
    );
  }

  draw(ctx: CanvasRenderingContext2D, data: KlineLayerData): void {
    const { kline } = data;
    if (kline.length === 0 || this.period <= 0) return;

    const sma = computeSMA(kline, this.period);
    drawSeriesLine(ctx, sma, data, { color: this.color });
  }
}
