import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  attachCanvasViewHost,
  GenericIndicatorView,
  getIndicator,
  ScrollController,
  ZoomController,
  type ChartDataState,
  type IndicatorCalcParams,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";

import { useKlineEventBus } from "../../../context/KeisenEventBusContext";
import { useKlineStore } from "../../../context/KeisenStoreContext";
import { LayerReconcilerRoot } from "../../../reconciler/LayerReconcilerRoot";

export type IndicatorViewProps = {
  store?: Store<KeisenState<ChartDataState>>;
  paneId: string;
  indicatorName: string;
  calcParams: IndicatorCalcParams;
  layerChildren: ReactNode;
};

export const IndicatorView = ({
  store: storeProp,
  paneId,
  indicatorName,
  calcParams,
  layerChildren,
}: IndicatorViewProps) => {
  const contextStore = useKlineStore();
  const store = storeProp ?? contextStore;
  const bus = useKlineEventBus();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<GenericIndicatorView | null>(null);
  const viewRef = useRef<GenericIndicatorView | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const descriptor = getIndicator(indicatorName);
    if (!descriptor) {
      throw new Error(
        `[keisen] Unknown indicator "${indicatorName}". Call registerIndicator first.`,
      );
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const indicatorView = new GenericIndicatorView(ctx, store, {
      paneId,
      descriptor,
    });
    indicatorView.setCalcParams(calcParams);
    viewRef.current = indicatorView;
    setView(indicatorView);

    const scrollController = new ScrollController(store, bus, paneId);
    const zoomController = new ZoomController(store, bus, paneId);

    const detachHost = attachCanvasViewHost({
      container,
      canvas,
      view: indicatorView,
      store,
      pointer: { viewId: paneId, bus, mode: "chart" },
    });

    return () => {
      detachHost();
      viewRef.current = null;
      setView(null);
      indicatorView.destroy();
      scrollController.destroy();
      zoomController.destroy();
    };
    // paneId / indicatorName identity the view instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, bus, paneId, indicatorName]);

  useEffect(() => {
    viewRef.current?.setCalcParams(calcParams);
  }, [calcParams]);

  return (
    <>
      <div
        id={`${paneId}-view`}
        ref={containerRef}
        style={{ width: "100%", height: "100%", minWidth: 0 }}
      >
        <canvas
          id={`${paneId}-canvas`}
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
          }}
        />
      </div>
      {view ? (
        <LayerReconcilerRoot view={view}>{layerChildren}</LayerReconcilerRoot>
      ) : null}
    </>
  );
};
