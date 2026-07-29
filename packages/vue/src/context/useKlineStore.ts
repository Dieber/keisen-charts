import { inject } from "vue";

import { keisenStoreKey, type KeisenStore } from "./keys";

export const useKlineStore = (): KeisenStore => {
  const store = inject(keisenStoreKey, null);
  if (!store) {
    throw new Error("useKlineStore must be used within KeisenChart");
  }
  return store;
};
