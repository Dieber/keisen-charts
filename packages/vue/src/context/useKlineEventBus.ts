import type { EventBus } from "@keisen-charts/core";
import { inject } from "vue";

import { keisenEventBusKey } from "./keys";

export const useKlineEventBus = (): EventBus => {
  const bus = inject(keisenEventBusKey, null);
  if (!bus) {
    throw new Error("useKlineEventBus must be used within KeisenChart");
  }
  return bus;
};
