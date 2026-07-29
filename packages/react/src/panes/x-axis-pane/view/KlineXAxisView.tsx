import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  attachCanvasViewHost,
  MainKlineXAxisView,
  type ChartDataState,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

import { useKlineStore } from "../../../context/KeisenStoreContext";

export const X_AXIS_HEIGHT = 28;

type KlineXAxisViewProps = {
  store?: Store<KeisenState<ChartDataState>>;
};

export const KlineXAxisView = ({ store: storeProp }: KlineXAxisViewProps) => {
  const contextStore = useKlineStore();
  const store = storeProp ?? contextStore;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.ui.indexDomain, onStoreChange),
    () => store.getState().ui.indexDomain,
    () => store.getState().ui.indexDomain,
  );

  useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.ui.viewportWidth, onStoreChange),
    () => store.getState().ui.viewportWidth,
    () => store.getState().ui.viewportWidth,
  );

  useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.data.kline, onStoreChange),
    () => store.getState().data.kline,
    () => store.getState().data.kline,
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const xAxisView = new MainKlineXAxisView(ctx, store);
    const detachHost = attachCanvasViewHost({
      container,
      canvas,
      view: xAxisView,
    });

    return () => {
      detachHost();
      xAxisView.destroy();
    };
  }, [store]);

  return (
    <div
      id="kline-x-axis-view"
      ref={containerRef}
      style={{
        width: "100%",
        height: X_AXIS_HEIGHT,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <canvas
        id="kline-x-axis-canvas"
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default KlineXAxisView;
