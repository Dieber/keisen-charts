import { priceToY } from "../../../../math/priceViewport";
import { indexToX } from "../../../../math/viewport";
import type { KlineLayerData } from "../../../../types/kline";

export type DrawSeriesLineOptions = {
  color: string;
  lineWidth?: number;
};

export const drawSeriesLine = (
  ctx: CanvasRenderingContext2D,
  series: (number | null)[],
  data: KlineLayerData,
  options: DrawSeriesLineOptions,
): void => {
  const { kline, viewport } = data;
  const { indexDomain, priceDomain, viewportWidth, viewportHeight } = viewport;
  const { color, lineWidth = 1.5 } = options;

  const startBar = Math.max(0, Math.floor(indexDomain.start));
  const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([]);
  ctx.beginPath();

  let started = false;

  for (let barIndex = startBar; barIndex <= endBar; barIndex++) {
    const value = series[barIndex];
    if (value === null) {
      started = false;
      continue;
    }

    const x = indexToX(barIndex, indexDomain, viewportWidth);
    const y = priceToY(value, priceDomain, viewportHeight);

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
};
