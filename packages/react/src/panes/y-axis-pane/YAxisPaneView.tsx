import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import {
  attachCanvasViewHost,
  createEventBus,
  createPriceFormatter,
  formatIndicatorTick,
  getPriceFormatMinMove,
  YAxisView,
  YZoomController,
  type ChartDataState,
  type KeisenState,
  type PriceFormatter,
  type Store,
  type YAxisViewConfig,
  type YZoomControllerConfig,
} from "@keisen-charts/core";

import { useKlineStore } from "../../context/KeisenStoreContext";
import { useYAxisPaneWidth } from "./yAxisWidth";

export type YAxisPaneViewProps = {
  config: YAxisViewConfig;
  zoomConfig?: YZoomControllerConfig;
  store?: Store<KeisenState<ChartDataState>>;
  /** DOM id 前缀，例如 `macd-y-axis` → `macd-y-axis-view` / `macd-y-axis-canvas` */
  elementId: string;
};

export const YAxisPaneView = ({
  config,
  zoomConfig,
  store: storeProp,
  elementId,
}: YAxisPaneViewProps) => {
  const contextStore = useKlineStore();
  const store = storeProp ?? contextStore;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const domain = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => config.selectDomain(state),
        onStoreChange,
      ),
    () => config.selectDomain(store.getState()),
    () => config.selectDomain(store.getState()),
  );

  const viewportHeight = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => config.selectViewportHeight(state),
        onStoreChange,
      ),
    () => config.selectViewportHeight(store.getState()),
    () => config.selectViewportHeight(store.getState()),
  );

  const priceFormat = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.priceFormat, onStoreChange),
    () => store.getState().config.priceFormat,
    () => store.getState().config.priceFormat,
  );

  const { formatTick, minMove } = useMemo(() => {
    if (config.formatTick) {
      return { formatTick: config.formatTick as PriceFormatter, minMove: undefined };
    }
    if (config.usePriceFormatConfig) {
      return {
        formatTick: createPriceFormatter(priceFormat),
        minMove: getPriceFormatMinMove(priceFormat),
      };
    }
    return { formatTick: formatIndicatorTick, minMove: undefined };
  }, [config.formatTick, config.usePriceFormatConfig, priceFormat]);

  const axisWidth = useYAxisPaneWidth(
    domain,
    viewportHeight,
    formatTick,
    minMove,
  );
  const bus = useMemo(
    () => (zoomConfig ? createEventBus() : null),
    [zoomConfig],
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const yAxisView = new YAxisView(ctx, store, config);
    const yZoomController =
      zoomConfig && bus
        ? new YZoomController(store, bus, zoomConfig)
        : null;

    const detachHost = attachCanvasViewHost({
      container,
      canvas,
      view: yAxisView,
      pointer:
        zoomConfig && bus
          ? { viewId: zoomConfig.viewId, bus, mode: "y-axis" }
          : undefined,
    });

    return () => {
      detachHost();
      yAxisView.destroy();
      yZoomController?.destroy();
    };
  }, [store, bus, axisWidth, config, zoomConfig]);

  return (
    <div
      id={`${elementId}-view`}
      ref={containerRef}
      style={{
        width: axisWidth,
        height: "100%",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <canvas
        id={`${elementId}-canvas`}
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: zoomConfig ? "ns-resize" : undefined,
          touchAction: "none",
        }}
      />
    </div>
  );
};

export default YAxisPaneView;
