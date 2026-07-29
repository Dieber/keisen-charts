import {
  appendBarInStore,
  prependBarsInStore,
  replaceKlineInStore,
  type ChartDataState,
  type KlineBar,
} from "@keisen-charts/core";
import type { DeepReadonly, Ref } from "vue";

import { useKlineStore } from "../context/useKlineStore";
import { useStoreSlice } from "./useStoreSlice";

export const useKlineData = () => {
  const store = useKlineStore();
  const data = useStoreSlice(store, (state) => state.data);

  const setData = (patch: Partial<ChartDataState>) => {
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
  };

  const replaceKline = (bars: KlineBar[]) => {
    replaceKlineInStore(store, bars);
  };

  const appendBars = (bars: KlineBar[]) => {
    for (const bar of bars) {
      appendBarInStore(store, bar);
    }
  };

  const prependBars = (bars: KlineBar[]) => {
    prependBarsInStore(store, bars);
  };

  return {
    data: data as DeepReadonly<Ref<ChartDataState>>,
    setData,
    appendBars,
    replaceKline,
    prependBars,
  };
};
