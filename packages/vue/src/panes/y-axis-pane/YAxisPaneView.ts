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
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch,
  type PropType,
} from "vue";

import { useKlineStore } from "../../context/useKlineStore";
import { useStoreSlice } from "../../composables/useStoreSlice";
import { useYAxisPaneWidth } from "./yAxisWidth";

export const YAxisPaneView = defineComponent({
  name: "YAxisPaneView",
  props: {
    config: {
      type: Object as PropType<YAxisViewConfig>,
      required: true,
    },
    zoomConfig: {
      type: Object as PropType<YZoomControllerConfig | undefined>,
      default: undefined,
    },
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>> | undefined>,
      default: undefined,
    },
    elementId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const contextStore = useKlineStore();
    const store = computed(() => props.store ?? contextStore);
    const containerRef = ref<HTMLDivElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    const domain = useStoreSlice(store.value, (state) =>
      props.config.selectDomain(state),
    );
    const viewportHeight = useStoreSlice(store.value, (state) =>
      props.config.selectViewportHeight(state),
    );
    const priceFormat = useStoreSlice(
      store.value,
      (state) => state.config.priceFormat,
    );

    const formatTick = computed((): PriceFormatter => {
      if (props.config.formatTick) {
        return props.config.formatTick as PriceFormatter;
      }
      if (props.config.usePriceFormatConfig) {
        return createPriceFormatter(priceFormat.value);
      }
      return formatIndicatorTick;
    });

    const minMove = computed(() => {
      if (props.config.formatTick) return undefined;
      if (props.config.usePriceFormatConfig) {
        return getPriceFormatMinMove(priceFormat.value);
      }
      return undefined;
    });

    const axisWidth = useYAxisPaneWidth(
      () => domain.value,
      () => viewportHeight.value,
      () => formatTick.value,
      () => minMove.value,
    );

    const localBus = props.zoomConfig ? createEventBus() : null;

    let detachHost: (() => void) | null = null;
    let yAxisView: YAxisView | null = null;
    let yZoomController: YZoomController | null = null;

    const cleanup = () => {
      detachHost?.();
      detachHost = null;
      yAxisView?.destroy();
      yAxisView = null;
      yZoomController?.destroy();
      yZoomController = null;
    };

    const mount = () => {
      cleanup();
      const container = containerRef.value;
      const canvas = canvasRef.value;
      if (!container || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentStore = store.value;
      yAxisView = new YAxisView(ctx, currentStore, props.config);
      yZoomController =
        props.zoomConfig && localBus
          ? new YZoomController(currentStore, localBus, props.zoomConfig)
          : null;

      detachHost = attachCanvasViewHost({
        container,
        canvas,
        view: yAxisView,
        pointer:
          props.zoomConfig && localBus
            ? { viewId: props.zoomConfig.viewId, bus: localBus, mode: "y-axis" }
            : undefined,
      });
    };

    watch(
      () =>
        [
          store.value,
          axisWidth.value,
          props.config,
          props.zoomConfig,
          containerRef.value,
          canvasRef.value,
        ] as const,
      () => {
        if (containerRef.value && canvasRef.value) {
          mount();
        }
      },
      { flush: "post", immediate: true },
    );

    onBeforeUnmount(cleanup);

    return () =>
      h(
        "div",
        {
          id: `${props.elementId}-view`,
          ref: containerRef,
          style: {
            width: `${axisWidth.value}px`,
            height: "100%",
            flexShrink: 0,
            overflow: "hidden",
          },
        },
        [
          h("canvas", {
            id: `${props.elementId}-canvas`,
            ref: canvasRef,
            style: {
              display: "block",
              width: "100%",
              height: "100%",
              cursor: props.zoomConfig ? "ns-resize" : undefined,
              touchAction: "none",
            },
          }),
        ],
      );
  },
});

export default YAxisPaneView;
