import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  createKeisenStore,
  createEventBus,
  type ChartPointerInfo,
  type KlineBar,
  type KlineTimezone,
  type PriceFormat,
  type Resolution,
  type ThemeInput,
  type ThemeMode,
  type UpDownScheme,
} from "@keisen-charts/core";

import { MainKlineChart } from "./charts/MainKlineChart";
import { MACDChart } from "./charts/MACDChart";
import {
  RSIChart,
  KDJChart,
  OBVChart,
  CCIChart,
  WRChart,
  DMIChart,
  MTMChart,
} from "./charts/indicatorCharts";
import { VolumeChart } from "./charts/VolumeChart";
import { KeisenEventBusContext } from "./context/KeisenEventBusContext";
import { KeisenStoreContext } from "./context/KeisenStoreContext";
import { DataController } from "./data/DataController";
import { applyThemePropsToStore, ThemeCallbacksProvider } from "./hooks/useKlineTheme";
import {
  applyLocaleToStore,
  LocaleCallbacksProvider,
} from "./hooks/useKlineLocale";
import {
  applyTimezonePropsToStore,
  TimezoneCallbacksProvider,
} from "./hooks/useKlineTimezone";
import { ResolutionCallbacksProvider } from "./hooks/useKlineResolution";
import { CrosshairControllerBridge } from "./interaction/CrosshairControllerBridge";
import { ChartPointerBridge } from "./interaction/ChartPointerBridge";
import { DrawingControllerBridge } from "./interaction/DrawingControllerBridge";
import {
  buildDefaultSubPaneWeights,
  buildGridRows,
  getRequestedSubSlots,
  getSubPanePlacements,
  getXAxisRow,
  partitionChartChildren,
  reconcileSubPaneWeights,
  type SubChartSlot,
} from "./layout/chartLayout";
import { ensureBuiltinIndicatorCharts } from "./indicators/registerBuiltinIndicators";
import { KlineCandles } from "./layers/KlineCandles";
import { KlineYAxisPane } from "./panes/main-kline-y-axis-pane/KlineYAxisPane";
import { IndicatorYAxisPane } from "./panes/indicator-y-axis-pane/IndicatorYAxisPane";
import { XAxisPane } from "./panes/x-axis-pane/XAxisPane";
import { X_AXIS_HEIGHT } from "./panes/x-axis-pane/view/KlineXAxisView";
import type { GetDataFn, OnSubscribeFn } from "./types";

ensureBuiltinIndicatorCharts();

/** Opacity while switching symbol/resolution (old series stays visible). */
const CONTEXT_LOADING_OPACITY = 0.45;

const DEFAULT_MAIN_CHART = (
  <MainKlineChart>
    <KlineCandles />
  </MainKlineChart>
);

const hasMainKlineChart = (children: ReactNode): boolean =>
  Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      (child.type === MainKlineChart ||
        (typeof child.type === "function" &&
          "displayName" in child.type &&
          child.type.displayName === "MainKlineChart")),
  );

const getYAxisForSlot = (slot: string): ReactNode => (
  <IndicatorYAxisPane paneId={slot} />
);

const DEFAULT_CHART_BY_SLOT: Record<string, ReactNode> = {
  volume: <VolumeChart />,
  macd: <MACDChart />,
  rsi: <RSIChart />,
  kdj: <KDJChart />,
  obv: <OBVChart />,
  cci: <CCIChart />,
  wr: <WRChart />,
  dmi: <DMIChart />,
  mtm: <MTMChart />,
};

type KeisenChartProps = {
  children?: ReactNode;
  header?: ReactNode;
  data?: KlineBar[];
  getData?: GetDataFn;
  onSubscribe?: OnSubscribeFn;
  resolution?: Resolution;
  onResolutionChange?: (resolution: Resolution) => void;
  symbol?: string;
  /** 皮肤：preset id、完整定义、或 token 覆盖 */
  theme?: ThemeInput;
  onThemeChange?: (theme: ThemeInput) => void;
  /** 明暗；默认 dark */
  mode?: ThemeMode;
  /** 涨跌色极性；默认 green-up */
  upDown?: UpDownScheme;
  onModeChange?: (mode: ThemeMode) => void;
  onUpDownChange?: (scheme: UpDownScheme) => void;
  /** 展示时区；默认 local */
  timezone?: KlineTimezone;
  onTimezoneChange?: (timezone: KlineTimezone) => void;
  /** 文案 locale id；默认 zh-CN（需先 registerLocale） */
  locale?: string;
  onLocaleChange?: (localeId: string) => void;
  /** 主图 / 副图左上角信息面板，默认 true */
  showDataPanel?: boolean;
  /** 主图价格格式（Y 轴 / 网格 / 十字线 / OHLC / legend） */
  priceFormat?: PriceFormat;
  /** 指针在图表上移动；离开时为 null */
  onPointerMove?: (info: ChartPointerInfo | null) => void;
  onPointerDown?: (info: ChartPointerInfo) => void;
  onPointerUp?: (info: ChartPointerInfo) => void;
  /** 短按（无拖拽）点击 / 触摸 */
  onClick?: (info: ChartPointerInfo) => void;
};

export const KeisenChart = ({
  children,
  header,
  data,
  getData,
  onSubscribe,
  resolution = "1",
  onResolutionChange,
  symbol,
  theme,
  onThemeChange,
  mode: modeProp,
  upDown: upDownProp,
  onModeChange,
  onUpDownChange,
  timezone: timezoneProp,
  onTimezoneChange,
  locale: localeProp,
  onLocaleChange,
  showDataPanel = true,
  priceFormat,
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onClick,
}: KeisenChartProps) => {
  const store = useMemo(() => createKeisenStore(), []);
  const bus = useMemo(() => createEventBus(), []);

  useEffect(() => {
    applyThemePropsToStore(store, theme, modeProp, upDownProp);
  }, [store, theme, modeProp, upDownProp]);

  useEffect(() => {
    applyTimezonePropsToStore(store, timezoneProp);
  }, [store, timezoneProp]);

  useEffect(() => {
    applyLocaleToStore(store, localeProp);
  }, [store, localeProp]);

  useEffect(() => {
    store.setState((prev) => {
      if (prev.config.showDataPanel === showDataPanel) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          showDataPanel,
        },
      };
    });
  }, [store, showDataPanel]);

  useEffect(() => {
    if (priceFormat === undefined) return;
    store.setState((prev) => {
      if (prev.config.priceFormat === priceFormat) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          priceFormat,
        },
      };
    });
  }, [store, priceFormat]);

  const chartChildren = useMemo(() => {
    if (!children || !hasMainKlineChart(children)) {
      return DEFAULT_MAIN_CHART;
    }
    return children;
  }, [children]);

  const slots = useMemo(
    () => partitionChartChildren(chartChildren),
    [chartChildren],
  );

  const requestedSlots = useMemo(() => getRequestedSubSlots(slots), [slots]);

  const chartsSnapshot = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.ui.charts, onStoreChange),
    () => store.getState().ui.charts,
    () => store.getState().ui.charts,
  );

  const resolvedTheme = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => state.config.resolvedTheme,
        onStoreChange,
      ),
    () => store.getState().config.resolvedTheme,
    () => store.getState().config.resolvedTheme,
  );

  const themeMode = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.mode, onStoreChange),
    () => store.getState().config.mode,
    () => store.getState().config.mode,
  );

  const dataStatus = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.data.meta?.status, onStoreChange),
    () => store.getState().data.meta?.status,
    () => store.getState().data.meta?.status,
  );
  const isContextLoading = dataStatus === "loading";

  const visibleSlots = useMemo(
    () =>
      requestedSlots.filter((slot) => chartsSnapshot[slot]?.show !== false),
    [requestedSlots, chartsSnapshot],
  );

  const [subPaneWeights, setSubPaneWeights] = useState<number[]>(() =>
    buildDefaultSubPaneWeights(visibleSlots),
  );
  const prevVisibleRef = useRef<SubChartSlot[]>(visibleSlots);

  useEffect(() => {
    const prev = prevVisibleRef.current;
    prevVisibleRef.current = visibleSlots;
    setSubPaneWeights((prevWeights) =>
      reconcileSubPaneWeights(prev, prevWeights, visibleSlots),
    );
  }, [visibleSlots]);

  const mainChartNode = slots.main ?? DEFAULT_MAIN_CHART;

  const gridTemplateRows = buildGridRows({
    subPaneWeights,
    visibleSlots,
  });

  const placements = getSubPanePlacements(visibleSlots);
  const xAxisRow = getXAxisRow(visibleSlots.length);

  const gridStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gridTemplateRows,
    opacity: isContextLoading ? CONTEXT_LOADING_OPACITY : 1,
    pointerEvents: isContextLoading ? "none" : undefined,
    transition: "opacity 120ms ease",
  };

  const mainChartCellStyle: CSSProperties = {
    gridColumn: 1,
    gridRow: 1,
    minWidth: 0,
    minHeight: 0,
  };

  const yAxisCellStyle: CSSProperties = {
    gridColumn: 2,
    gridRow: 1,
    minHeight: 0,
  };

  const xAxisCellStyle: CSSProperties = {
    gridColumn: 1,
    gridRow: xAxisRow,
    minWidth: 0,
    height: X_AXIS_HEIGHT,
  };

  const rootStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background:
      resolvedTheme.background !== "transparent"
        ? resolvedTheme.background
        : themeMode === "light"
          ? "#ffffff"
          : undefined,
  };

  return (
    <KeisenStoreContext.Provider value={store}>
      <ThemeCallbacksProvider
        onThemeChange={onThemeChange}
        onModeChange={onModeChange}
        onUpDownChange={onUpDownChange}
      >
      <TimezoneCallbacksProvider onTimezoneChange={onTimezoneChange}>
      <LocaleCallbacksProvider onLocaleChange={onLocaleChange}>
      <ResolutionCallbacksProvider
        resolution={resolution}
        onResolutionChange={onResolutionChange}
      >
      <DataController
        store={store}
        data={data}
        getData={getData}
        onSubscribe={onSubscribe}
        resolution={resolution}
        symbol={symbol}
      />
      <CrosshairControllerBridge store={store} bus={bus} />
      <ChartPointerBridge
        store={store}
        bus={bus}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
      />
      <DrawingControllerBridge store={store} bus={bus} />
      <div style={rootStyle}>
        {header}
        <KeisenEventBusContext.Provider value={bus}>
          <div style={{ ...gridStyle, flex: 1, minHeight: 0 }}>
            <div style={mainChartCellStyle}>{mainChartNode}</div>
            <div style={yAxisCellStyle}>
              <KlineYAxisPane />
            </div>

            {visibleSlots.map((slot) => {
              const placement = placements[slot];
              if (!placement) return null;

              const chartNode =
                slots[slot] ?? DEFAULT_CHART_BY_SLOT[slot] ?? null;
              const yAxisNode = getYAxisForSlot(slot);

              return (
                <div key={slot} style={{ display: "contents" }}>
                  <div
                    style={{
                      gridColumn: 1,
                      gridRow: placement.chartRow,
                      minWidth: 0,
                      minHeight: 0,
                      borderTop: `1px solid ${resolvedTheme.axisTick}`,
                    }}
                  >
                    {chartNode}
                  </div>
                  {yAxisNode ? (
                    <div
                      style={{
                        gridColumn: 2,
                        gridRow: placement.yAxisRow,
                        minHeight: 0,
                        borderTop: `1px solid ${resolvedTheme.axisTick}`,
                      }}
                    >
                      {yAxisNode}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div style={xAxisCellStyle}>
              <XAxisPane />
            </div>
          </div>
        </KeisenEventBusContext.Provider>
      </div>
      </ResolutionCallbacksProvider>
      </LocaleCallbacksProvider>
      </TimezoneCallbacksProvider>
      </ThemeCallbacksProvider>
    </KeisenStoreContext.Provider>
  );
};

export default KeisenChart;
