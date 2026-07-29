import {
  appendBarInStore,
  prependBarsInStore,
  replaceKlineInStore,
  type ChartDataState,
  type KlineBar,
} from "@keisen-charts/core";
import { useCallback, useSyncExternalStore } from "react";

import { useKlineStore } from "../context/KeisenStoreContext";

export const useKlineData = () => {
  const store = useKlineStore();

  const data = useSyncExternalStore(
    (onStoreChange) => store.subscribe(onStoreChange),
    () => store.getState().data,
    () => store.getState().data,
  );

  const setData = useCallback(
    (patch: Partial<ChartDataState>) => {
      store.setState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          ...patch,
          meta: {
            status: prev.data.meta?.status ?? "idle",
            ...prev.data.meta,
            ...patch.meta,
          },
        },
      }));
    },
    [store],
  );

  const replaceKline = useCallback(
    (bars: KlineBar[]) => {
      replaceKlineInStore(store, bars);
    },
    [store],
  );

  const appendBars = useCallback(
    (bars: KlineBar[]) => {
      for (const bar of bars) {
        appendBarInStore(store, bar);
      }
    },
    [store],
  );

  const prependBars = useCallback(
    (bars: KlineBar[]) => {
      prependBarsInStore(store, bars);
    },
    [store],
  );

  return {
    data: data as Readonly<ChartDataState>,
    setData,
    appendBars,
    replaceKline,
    prependBars,
  };
};
