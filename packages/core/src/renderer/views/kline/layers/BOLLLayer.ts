import type { ILayer } from "../../../base/ILayer";
import { computeBOLL } from "../../../../indicators/indicators";
import type { LegendItem } from "../../../shared/legend";
import { formatLegendValue } from "../../../shared/legend";
import type { KlineBar, KlineLayerData } from "../../../../types/kline";
import { drawSeriesLine } from "./drawSeriesLine";
import { collectSeriesVisiblePrices } from "./visiblePriceExtent";

const DEFAULT_COLORS = {
  upper: "#FF5722",
  middle: "#9E9E9E",
  lower: "#4CAF50",
} as const;

export class BOLLLayer implements ILayer<CanvasRenderingContext2D, KlineLayerData> {
  readonly id: string;
  readonly zIndex: number = 2;

  private readonly period: number;
  private readonly stdDev: number;
  private readonly upperColor: string;
  private readonly middleColor: string;
  private readonly lowerColor: string;

  constructor(
    period: number = 20,
    stdDev: number = 2,
    colors?: {
      upperColor?: string;
      middleColor?: string;
      lowerColor?: string;
    },
  ) {
    this.period = period;
    this.stdDev = stdDev;
    this.id = `BOLLLayer-${period}-${stdDev}`;
    this.upperColor = colors?.upperColor ?? DEFAULT_COLORS.upper;
    this.middleColor = colors?.middleColor ?? DEFAULT_COLORS.middle;
    this.lowerColor = colors?.lowerColor ?? DEFAULT_COLORS.lower;
  }

  getLegendItems(barIndex: number, data: unknown): LegendItem | null {
    const layerData = data as KlineLayerData;
    const { kline } = layerData;
    if (kline.length === 0 || this.period <= 0 || this.stdDev <= 0) return null;

    const { upper, middle, lower } = computeBOLL(
      kline,
      this.period,
      this.stdDev,
    );
    const fmt = layerData.formatPrice;

    return {
      groupId: "BOLL",
      groupLabel: "BOLL",
      paramLabel: `${this.period},${this.stdDev}`,
      sortKey: this.period,
      order: 0,
      segments: [
        {
          text: `UPPER: ${formatLegendValue(upper[barIndex], fmt)}`,
          color: this.upperColor,
        },
        {
          text: `MID: ${formatLegendValue(middle[barIndex], fmt)}`,
          color: this.middleColor,
        },
        {
          text: `LOWER: ${formatLegendValue(lower[barIndex], fmt)}`,
          color: this.lowerColor,
        },
      ],
    };
  }

  collectVisiblePrices(
    kline: KlineBar[],
    startBar: number,
    endBar: number,
  ): (number | null)[] {
    if (kline.length === 0 || this.period <= 0 || this.stdDev <= 0) return [];
    const { upper, middle, lower } = computeBOLL(
      kline,
      this.period,
      this.stdDev,
    );
    return [
      ...collectSeriesVisiblePrices(upper, startBar, endBar),
      ...collectSeriesVisiblePrices(middle, startBar, endBar),
      ...collectSeriesVisiblePrices(lower, startBar, endBar),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, data: KlineLayerData): void {
    const { kline } = data;
    if (kline.length === 0 || this.period <= 0 || this.stdDev <= 0) return;

    const { upper, middle, lower } = computeBOLL(kline, this.period, this.stdDev);

    drawSeriesLine(ctx, upper, data, { color: this.upperColor });
    drawSeriesLine(ctx, middle, data, { color: this.middleColor });
    drawSeriesLine(ctx, lower, data, { color: this.lowerColor });
  }
}
