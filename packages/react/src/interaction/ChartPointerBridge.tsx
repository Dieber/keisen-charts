import { useEffect, useRef } from "react";

import {
  ChartPointerController,
  type ChartDataState,
  type ChartPointerHandlers,
  type ChartPointerInfo,
  type EventBus,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

export type ChartPointerBridgeProps = {
  store: Store<KeisenState<ChartDataState>>;
  bus: EventBus;
  onPointerMove?: (info: ChartPointerInfo | null) => void;
  onPointerDown?: (info: ChartPointerInfo) => void;
  onPointerUp?: (info: ChartPointerInfo) => void;
  onClick?: (info: ChartPointerInfo) => void;
};

export const ChartPointerBridge = ({
  store,
  bus,
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onClick,
}: ChartPointerBridgeProps) => {
  const handlersRef = useRef<ChartPointerHandlers>({
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onClick,
  });
  handlersRef.current = {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onClick,
  };

  useEffect(() => {
    const controller = new ChartPointerController(store, bus, {
      onPointerMove: (info) => handlersRef.current.onPointerMove?.(info),
      onPointerDown: (info) => handlersRef.current.onPointerDown?.(info),
      onPointerUp: (info) => handlersRef.current.onPointerUp?.(info),
      onClick: (info) => handlersRef.current.onClick?.(info),
    });
    return () => controller.destroy();
  }, [store, bus]);

  return null;
};
