import { useEffect } from "react";

import {
  CrosshairController,
  type ChartDataState,
  type EventBus,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

type CrosshairControllerBridgeProps = {
  store: Store<KeisenState<ChartDataState>>;
  bus: EventBus;
};

export const CrosshairControllerBridge = ({
  store,
  bus,
}: CrosshairControllerBridgeProps) => {
  useEffect(() => {
    const controller = new CrosshairController(store, bus);
    return () => controller.destroy();
  }, [store, bus]);

  return null;
};
