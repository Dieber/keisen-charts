import {
  applyLocaleToStore,
  applyThemePropsToStore,
  applyTimezonePropsToStore,
  createEventBus,
  createKeisenStore,
  type ChartPointerInfo,
  type GetDataFn,
  type KlineBar,
  type KlineTimezone,
  type OnSubscribeFn,
  type PriceFormat,
  type Resolution,
  type ThemeInput,
  type ThemeMode,
  type UpDownScheme,
} from "@keisen-charts/core";
import {
  computed,
  defineComponent,
  h,
  provide,
  ref,
  watch,
  type PropType,
  type StyleValue,
  type VNode,
} from "vue";

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
import {
  keisenEventBusKey,
  keisenStoreKey,
  localeCallbacksKey,
  resolutionCallbacksKey,
  themeCallbacksKey,
  timezoneCallbacksKey,
} from "./context/keys";
import { useStoreSlice } from "./composables/useStoreSlice";
import { DataController } from "./data/DataController";
import { ensureBuiltinIndicatorCharts } from "./indicators/registerBuiltinIndicators";
import { CrosshairControllerBridge } from "./interaction/CrosshairControllerBridge";
import { ChartPointerBridge } from "./interaction/ChartPointerBridge";
import { DrawingControllerBridge } from "./interaction/DrawingControllerBridge";
import { KlineCandles } from "./layers/KlineCandles";
import {
  buildDefaultSubPaneWeights,
  buildGridRows,
  getRequestedSubSlots,
  getSubPanePlacements,
  getXAxisRow,
  hasMainKlineChart,
  partitionChartVNodes,
  reconcileSubPaneWeights,
  type SubChartSlot,
} from "./layout/chartLayout";
import { IndicatorYAxisPane } from "./panes/indicator-y-axis-pane/IndicatorYAxisPane";
import { KlineYAxisPane } from "./panes/main-kline-y-axis-pane/KlineYAxisPane";
import { XAxisPane } from "./panes/x-axis-pane/XAxisPane";
import { X_AXIS_HEIGHT } from "./panes/x-axis-pane/view/KlineXAxisView";

ensureBuiltinIndicatorCharts();

/** Opacity while switching symbol/resolution (old series stays visible). */
const CONTEXT_LOADING_OPACITY = 0.45;

const DEFAULT_CHART_BY_SLOT: Record<string, () => VNode> = {
  volume: () => h(VolumeChart),
  macd: () => h(MACDChart),
  rsi: () => h(RSIChart),
  kdj: () => h(KDJChart),
  obv: () => h(OBVChart),
  cci: () => h(CCIChart),
  wr: () => h(WRChart),
  dmi: () => h(DMIChart),
  mtm: () => h(MTMChart),
};

export const KeisenChart = defineComponent({
  name: "KeisenChart",
  props: {
    data: {
      type: Array as PropType<KlineBar[] | undefined>,
      default: undefined,
    },
    getData: {
      type: Function as PropType<GetDataFn | undefined>,
      default: undefined,
    },
    onSubscribe: {
      type: Function as PropType<OnSubscribeFn | undefined>,
      default: undefined,
    },
    resolution: {
      type: String as PropType<Resolution>,
      default: "1",
    },
    symbol: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    theme: {
      type: [String, Object] as PropType<ThemeInput | undefined>,
      default: undefined,
    },
    mode: {
      type: String as PropType<ThemeMode | undefined>,
      default: undefined,
    },
    upDown: {
      type: String as PropType<UpDownScheme | undefined>,
      default: undefined,
    },
    timezone: {
      type: String as PropType<KlineTimezone | undefined>,
      default: undefined,
    },
    locale: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    showDataPanel: {
      type: Boolean,
      default: true,
    },
    priceFormat: {
      type: Object as PropType<PriceFormat | undefined>,
      default: undefined,
    },
  },
  emits: {
    "theme-change": (_theme: ThemeInput) => true,
    "mode-change": (_mode: ThemeMode) => true,
    "up-down-change": (_scheme: UpDownScheme) => true,
    "timezone-change": (_timezone: KlineTimezone) => true,
    "locale-change": (_localeId: string) => true,
    "resolution-change": (_resolution: Resolution) => true,
    "pointer-move": (_info: ChartPointerInfo | null) => true,
    "pointer-down": (_info: ChartPointerInfo) => true,
    "pointer-up": (_info: ChartPointerInfo) => true,
    click: (_info: ChartPointerInfo) => true,
  },
  setup(props, { slots, emit }) {
    const store = createKeisenStore();
    const bus = createEventBus();

    provide(keisenStoreKey, store);
    provide(keisenEventBusKey, bus);
    provide(themeCallbacksKey, {
      onThemeChange: (theme) => emit("theme-change", theme),
      onModeChange: (mode) => emit("mode-change", mode),
      onUpDownChange: (scheme) => emit("up-down-change", scheme),
    });
    provide(timezoneCallbacksKey, {
      onTimezoneChange: (timezone) => emit("timezone-change", timezone),
    });
    provide(localeCallbacksKey, {
      onLocaleChange: (localeId) => emit("locale-change", localeId),
    });
    provide(resolutionCallbacksKey, {
      get resolutionProp() {
        return props.resolution;
      },
      onResolutionChange: (next) => emit("resolution-change", next),
    });

    watch(
      () => [props.theme, props.mode, props.upDown] as const,
      ([theme, mode, upDown]) => {
        applyThemePropsToStore(store, theme, mode, upDown);
      },
      { immediate: true },
    );

    watch(
      () => props.timezone,
      (timezone) => {
        applyTimezonePropsToStore(store, timezone);
      },
      { immediate: true },
    );

    watch(
      () => props.locale,
      (locale) => {
        applyLocaleToStore(store, locale);
      },
      { immediate: true },
    );

    watch(
      () => props.showDataPanel,
      (showDataPanel) => {
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
      },
      { immediate: true },
    );

    watch(
      () => props.priceFormat,
      (priceFormat) => {
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
      },
      { immediate: true },
    );

    const chartsSnapshot = useStoreSlice(store, (state) => state.ui.charts);
    const resolvedTheme = useStoreSlice(
      store,
      (state) => state.config.resolvedTheme,
    );
    const themeMode = useStoreSlice(store, (state) => state.config.mode);
    const dataStatus = useStoreSlice(
      store,
      (state) => state.data.meta?.status,
    );

    const slotVNodes = computed(() => {
      const children = slots.default?.() ?? [];
      if (!hasMainKlineChart(children)) {
        return [
          h(MainKlineChart, null, () => [h(KlineCandles)]),
        ];
      }
      return children;
    });

    const slotsMap = computed(() => partitionChartVNodes(slotVNodes.value));
    const requestedSlots = computed(() => getRequestedSubSlots(slotsMap.value));

    const visibleSlots = computed(() =>
      requestedSlots.value.filter(
        (slot) => chartsSnapshot.value[slot]?.show !== false,
      ),
    );

    const subPaneWeights = ref(buildDefaultSubPaneWeights(visibleSlots.value));
    const prevVisibleRef = ref<SubChartSlot[]>(visibleSlots.value);

    watch(
      visibleSlots,
      (next) => {
        const prev = prevVisibleRef.value;
        prevVisibleRef.value = next;
        subPaneWeights.value = reconcileSubPaneWeights(
          prev,
          subPaneWeights.value,
          next,
        );
      },
      { immediate: true },
    );

    return () => {
      const map = slotsMap.value;
      const visible = visibleSlots.value;
      const mainChartNode =
        map.main ??
        h(MainKlineChart, null, () => [h(KlineCandles)]);

      const gridTemplateRows = buildGridRows({
        subPaneWeights: subPaneWeights.value,
        visibleSlots: visible,
      });
      const placements = getSubPanePlacements(visible);
      const xAxisRow = getXAxisRow(visible.length);

      const isContextLoading = dataStatus.value === "loading";
      const gridStyle: StyleValue = {
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gridTemplateRows,
        flex: 1,
        opacity: isContextLoading ? CONTEXT_LOADING_OPACITY : 1,
        pointerEvents: isContextLoading ? "none" : undefined,
        transition: "opacity 120ms ease",
      };

      const rootStyle: StyleValue = {
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background:
          resolvedTheme.value.background !== "transparent"
            ? resolvedTheme.value.background
            : themeMode.value === "light"
              ? "#ffffff"
              : undefined,
      };

      const subPaneNodes = visible.flatMap((slot) => {
        const placement = placements[slot];
        if (!placement) return [];

        const chartNode =
          map[slot] ?? DEFAULT_CHART_BY_SLOT[slot]?.() ?? null;
        const yAxisNode = h(IndicatorYAxisPane, { paneId: slot });

        return [
          h(
            "div",
            { key: slot, style: { display: "contents" } },
            [
              h(
                "div",
                {
                  style: {
                    gridColumn: "1",
                    gridRow: String(placement.chartRow),
                    minWidth: 0,
                    minHeight: 0,
                  },
                },
                chartNode ? [chartNode] : [],
              ),
              h(
                "div",
                {
                  style: {
                    gridColumn: "2",
                    gridRow: String(placement.yAxisRow),
                    minHeight: 0,
                  },
                },
                [yAxisNode],
              ),
            ],
          ),
        ];
      });

      return [
        h(DataController, {
          store,
          data: props.data,
          getData: props.getData,
          onSubscribe: props.onSubscribe,
          resolution: props.resolution,
          symbol: props.symbol,
        }),
        h(CrosshairControllerBridge, { store, bus }),
        h(ChartPointerBridge, {
          store,
          bus,
          onPointerMove: (info: ChartPointerInfo | null) =>
            emit("pointer-move", info),
          onPointerDown: (info: ChartPointerInfo) =>
            emit("pointer-down", info),
          onPointerUp: (info: ChartPointerInfo) => emit("pointer-up", info),
          onClick: (info: ChartPointerInfo) => emit("click", info),
        }),
        h(DrawingControllerBridge, { store, bus }),
        h("div", { style: rootStyle }, [
          slots.header?.(),
          h("div", { style: gridStyle }, [
            h(
              "div",
              {
                style: {
                  gridColumn: "1",
                  gridRow: "1",
                  minWidth: 0,
                  minHeight: 0,
                },
              },
              [mainChartNode],
            ),
            h(
              "div",
              {
                style: {
                  gridColumn: "2",
                  gridRow: "1",
                  minHeight: 0,
                },
              },
              [h(KlineYAxisPane)],
            ),
            ...subPaneNodes,
            h(
              "div",
              {
                style: {
                  gridColumn: "1",
                  gridRow: String(xAxisRow),
                  minWidth: 0,
                  height: `${X_AXIS_HEIGHT}px`,
                },
              },
              [h(XAxisPane)],
            ),
          ]),
        ]),
      ];
    };
  },
});

export default KeisenChart;
