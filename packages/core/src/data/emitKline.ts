import type { KeisenState, Store } from "../store/Store";
import type { ChartDataState, KlineBar } from "../types/kline";
import type { DataContext, SubscribeEmit } from "./types";
import {
  appendBarInStore,
  replaceKlineInStore,
  updateLastBarInStore,
} from "./klineMutations";

const isDev =
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

export const createSubscribeEmit = (
  store: Store<KeisenState<ChartDataState>>,
  getActiveContext: () => DataContext | null,
  expectedContext: DataContext,
): SubscribeEmit => {
  const assertActiveContext = (): boolean => {
    const active = getActiveContext();
    if (!active || active.cacheKey !== expectedContext.cacheKey) {
      return false;
    }
    return true;
  };

  const getLastBar = (): KlineBar | undefined => {
    const kline = store.getState().data.kline;
    return kline[kline.length - 1];
  };

  const append: SubscribeEmit["append"] = (bar) => {
    if (!assertActiveContext()) return;

    const lastBar = getLastBar();
    if (lastBar && bar.t <= lastBar.t) {
      if (isDev) {
        console.warn(
          "[Keisen] append time violation:",
          bar.t,
          "<=",
          lastBar.t,
        );
      }
      return;
    }

    appendBarInStore(store, bar);
  };

  const updateLast: SubscribeEmit["updateLast"] = (bar) => {
    if (!assertActiveContext()) return;

    const lastBar = getLastBar();
    if (!lastBar) {
      replaceKlineInStore(store, [bar]);
      return;
    }

    if (bar.t !== lastBar.t) {
      if (isDev) {
        console.warn(
          "[Keisen] updateLast time mismatch:",
          bar.t,
          "!=",
          lastBar.t,
        );
      }
      return;
    }

    updateLastBarInStore(store, bar);
  };

  const replace: SubscribeEmit["replace"] = (bars) => {
    if (!assertActiveContext()) return;
    replaceKlineInStore(store, bars);
  };

  /** TradingView-style：调用方只推 bar，库按时间决定 update / append */
  const bar: SubscribeEmit["bar"] = (next) => {
    if (!assertActiveContext()) return;

    const lastBar = getLastBar();
    if (!lastBar) {
      replaceKlineInStore(store, [next]);
      return;
    }

    if (next.t === lastBar.t) {
      updateLastBarInStore(store, next);
      return;
    }

    if (next.t > lastBar.t) {
      appendBarInStore(store, next);
      return;
    }

    if (isDev) {
      console.warn(
        "[Keisen] bar time violation:",
        next.t,
        "<",
        lastBar.t,
      );
    }
  };

  return { bar, append, updateLast, replace };
};
