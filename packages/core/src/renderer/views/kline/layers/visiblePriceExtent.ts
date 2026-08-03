import type { KlineBar } from "../../../../types/kline";

/** 主图 overlay 层可贡献可见区间价格，供 auto Y 域与 K 线一起取极值 */
export type VisiblePriceContributor = {
  collectVisiblePrices(
    kline: KlineBar[],
    startBar: number,
    endBar: number,
  ): Iterable<number | null | undefined>;
};

export const isVisiblePriceContributor = (
  layer: unknown,
): layer is VisiblePriceContributor =>
  typeof (layer as VisiblePriceContributor | null)?.collectVisiblePrices ===
  "function";

export const collectSeriesVisiblePrices = (
  series: readonly (number | null | undefined)[],
  startBar: number,
  endBar: number,
): (number | null)[] => {
  const values: (number | null)[] = [];
  for (let i = startBar; i <= endBar; i++) {
    values.push(series[i] ?? null);
  }
  return values;
};
