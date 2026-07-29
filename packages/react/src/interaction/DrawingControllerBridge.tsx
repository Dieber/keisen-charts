import { useEffect } from "react";

import {
  DrawingController,
  type ChartDataState,
  type EventBus,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

type DrawingControllerBridgeProps = {
  store: Store<KeisenState<ChartDataState>>;
  bus: EventBus;
};

export const DrawingControllerBridge = ({
  store,
  bus,
}: DrawingControllerBridgeProps) => {
  useEffect(() => {
    const controller = new DrawingController(store, bus);
    return () => controller.destroy();
  }, [store, bus]);

  return null;
};
