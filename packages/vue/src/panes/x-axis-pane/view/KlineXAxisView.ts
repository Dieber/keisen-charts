import {
  attachCanvasViewHost,
  MainKlineXAxisView,
  type ChartDataState,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";
import {
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch,
  type PropType,
} from "vue";

import { useKlineStore } from "../../../context/useKlineStore";
import { useStoreSlice } from "../../../composables/useStoreSlice";

export const X_AXIS_HEIGHT = 28;

export const KlineXAxisView = defineComponent({
  name: "KlineXAxisView",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>> | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const contextStore = useKlineStore();
    const store = () => props.store ?? contextStore;
    const containerRef = ref<HTMLDivElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    // Keep view reactive to domain / viewport / kline changes via subscription.
    useStoreSlice(store(), (state) => state.ui.indexDomain);
    useStoreSlice(store(), (state) => state.ui.viewportWidth);
    useStoreSlice(store(), (state) => state.data.kline);

    let detachHost: (() => void) | null = null;
    let xAxisView: MainKlineXAxisView | null = null;

    const cleanup = () => {
      detachHost?.();
      detachHost = null;
      xAxisView?.destroy();
      xAxisView = null;
    };

    const mount = () => {
      cleanup();
      const container = containerRef.value;
      const canvas = canvasRef.value;
      if (!container || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      xAxisView = new MainKlineXAxisView(ctx, store());
      detachHost = attachCanvasViewHost({
        container,
        canvas,
        view: xAxisView,
      });
    };

    watch(
      () => [store(), containerRef.value, canvasRef.value] as const,
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
          id: "kline-x-axis-view",
          ref: containerRef,
          style: {
            width: "100%",
            height: `${X_AXIS_HEIGHT}px`,
            flexShrink: 0,
            overflow: "hidden",
          },
        },
        [
          h("canvas", {
            id: "kline-x-axis-canvas",
            ref: canvasRef,
            style: {
              display: "block",
              width: "100%",
              height: "100%",
            },
          }),
        ],
      );
  },
});

export default KlineXAxisView;
