import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  attachCanvasViewHost,
  MainKlineView,
  ScrollController,
  YScrollController,
  ZoomController,
  type ChartDataState,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

import { useKlineEventBus } from "../../../context/KeisenEventBusContext";
import { useKlineStore } from "../../../context/KeisenStoreContext";
import { LayerReconcilerRoot } from "../../../reconciler/LayerReconcilerRoot";

type KlineViewProps = {
  store?: Store<KeisenState<ChartDataState>>;
  layerChildren: ReactNode;
};

const KlineView = ({ store: storeProp, layerChildren }: KlineViewProps) => {
  const contextStore = useKlineStore();
  const store = storeProp ?? contextStore;
  const bus = useKlineEventBus();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainKlineView, setMainKlineView] = useState<MainKlineView | null>(
    null,
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const view = new MainKlineView(ctx, store);
    setMainKlineView(view);

    const scrollController = new ScrollController(store, bus, "main");
    const yScrollController = new YScrollController(store, bus, "main");
    const zoomController = new ZoomController(store, bus, "main");

    const detachHost = attachCanvasViewHost({
      container,
      canvas,
      view,
      store,
      pointer: { viewId: "main", bus, mode: "chart" },
    });

    return () => {
      detachHost();
      setMainKlineView(null);
      view.destroy();
      scrollController.destroy();
      yScrollController.destroy();
      zoomController.destroy();
    };
  }, [store, bus]);

  return (
    <>
      <div
        id="kline-view"
        ref={containerRef}
        style={{ width: "100%", height: "100%", minWidth: 0 }}
      >
        <canvas
          id="kline-canvas"
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
          }}
        />
      </div>
      {mainKlineView ? (
        <LayerReconcilerRoot view={mainKlineView}>
          {layerChildren}
        </LayerReconcilerRoot>
      ) : null}
    </>
  );
};

export default KlineView;
