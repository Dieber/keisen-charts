import type { ILayer } from "../../../base/ILayer";
import { priceToY } from "../../../../math/priceViewport";
import {
  computeBarLayoutFromDomain,
  indexToX,
} from "../../../../math/viewport";
import type { KlineBar, KlineLayerData } from "../../../../types/kline";

/** 单根 K 线绘制所需的布局信息 */
type CandleLayout = {
  /** K 线中心 X 坐标 */
  x: number;
  /** 开盘价对应的 Y 坐标 */
  yOpen: number;
  /** 最高价对应的 Y 坐标 */
  yHigh: number;
  /** 最低价对应的 Y 坐标 */
  yLow: number;
  /** 收盘价对应的 Y 坐标 */
  yClose: number;
  /** 实体宽度 */
  bodyWidth: number;
  /** 上涨颜色 */
  colorUp: string;
  /** 下跌颜色 */
  colorDown: string;
};

/**
 * 绘制单根 K 线：上下影线 + 实体矩形。
 */
const drawCandle = (
  ctx: CanvasRenderingContext2D,
  data: KlineBar,
  layout: CandleLayout,
) => {
  const isUp = data.c >= data.o;
  const color = isUp ? layout.colorUp : layout.colorDown;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.x, layout.yHigh);
  ctx.lineTo(layout.x, layout.yLow);
  ctx.stroke();

  const bodyTop = Math.min(layout.yOpen, layout.yClose);
  const bodyHeight = Math.max(Math.abs(layout.yClose - layout.yOpen), 1);

  ctx.fillStyle = color;
  ctx.fillRect(
    layout.x - layout.bodyWidth / 2,
    bodyTop,
    layout.bodyWidth,
    bodyHeight,
  );
};

/** 主 K 线图 K 线层，负责在 Canvas 上绘制可见范围内的蜡烛图 */
export class KlineLayer implements ILayer<CanvasRenderingContext2D, KlineLayerData> {
  readonly id: string = "KlineLayer";
  readonly zIndex: number = 1;

  draw(ctx: CanvasRenderingContext2D, data: KlineLayerData): void {
    const { kline, viewport, theme } = data;
    if (kline.length === 0) return;

    const { indexDomain, priceDomain, viewportWidth, viewportHeight } = viewport;
    const bar = computeBarLayoutFromDomain(indexDomain, viewportWidth);

    const startBar = Math.max(0, Math.floor(indexDomain.start));
    const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));

    for (let barIndex = startBar; barIndex <= endBar; barIndex++) {
      const candle = kline[barIndex];
      if (!candle) continue;

      const x = indexToX(barIndex, indexDomain, viewportWidth);

      if (x + bar.width / 2 < 0 || x - bar.width / 2 > viewportWidth) continue;

      drawCandle(ctx, candle, {
        x,
        yOpen: priceToY(candle.o, priceDomain, viewportHeight),
        yHigh: priceToY(candle.h, priceDomain, viewportHeight),
        yLow: priceToY(candle.l, priceDomain, viewportHeight),
        yClose: priceToY(candle.c, priceDomain, viewportHeight),
        bodyWidth: bar.width,
        colorUp: theme.up,
        colorDown: theme.down,
      });
    }
  }
}
