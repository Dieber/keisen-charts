import { createContext, useContext } from "react";

import type { ChartDataState, KeisenState, Store } from "@keisen-charts/core";

export const KeisenStoreContext = createContext<Store<
  KeisenState<ChartDataState>
> | null>(null);

export const useKlineStore = () => {
  const store = useContext(KeisenStoreContext);
  if (!store) {
    throw new Error("useKlineStore must be used within KeisenStoreProvider");
  }
  return store;
};
