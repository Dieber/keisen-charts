import type { KlineBar, Resolution } from "../types/kline";

export type GetDataParams = {
  resolution: Resolution;
  symbol?: string;
  countBack?: number;
  from?: number;
  to?: number;
};

export type GetDataFn = (params: GetDataParams) => Promise<KlineBar[]>;

export type SubscribeEmit = {
  /** 按 `t` 自动分流：同最后一根 → updateLast；更大 → append；更小则忽略 */
  bar: (bar: KlineBar) => void;
  append: (bar: KlineBar) => void;
  updateLast: (bar: KlineBar) => void;
  replace: (bars: KlineBar[]) => void;
};

export type OnSubscribeFn = (
  params: { resolution: Resolution; symbol?: string },
  emit: SubscribeEmit,
) => void | (() => void);

export type DataContext = {
  cacheKey: string;
  resolution: Resolution;
  symbol?: string;
};
