import { createContext, useContext } from "react";

import type { EventBus } from "@keisen-charts/core";

export const KeisenEventBusContext = createContext<EventBus | null>(null);

export const useKlineEventBus = () => {
  const bus = useContext(KeisenEventBusContext);
  if (!bus) {
    throw new Error("useKlineEventBus must be used within KeisenEventBusProvider");
  }
  return bus;
};
