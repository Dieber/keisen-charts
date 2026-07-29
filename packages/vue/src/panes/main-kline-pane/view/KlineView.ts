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
import {
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode,
} from "vue";

import { useKlineEventBus } from "../../../context/useKlineEventBus";
import { useKlineStore } from "../../../context/useKlineStore";
import { LayerRendererRoot } from "../../../renderer/LayerRendererRoot";

export const KlineView = defineComponent({
  name: "KlineView",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>> | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const contextStore = useKlineStore();
    const bus = useKlineEventBus();
    const containerRef = ref<HTMLDivElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const mainKlineView = shallowRef<MainKlineView | null>(null);

    let detachHost: (() => void) | null = null;
    let scrollController: ScrollController | null = null;
    let yScrollController: YScrollController | null = null;
    let zoomController: ZoomController | null = null;
    let viewInstance: MainKlineView | null = null;

    const cleanup = () => {
      detachHost?.();
      detachHost = null;
      viewInstance?.destroy();
      viewInstance = null;
      mainKlineView.value = null;
      scrollController?.destroy();
      scrollController = null;
      yScrollController?.destroy();
      yScrollController = null;
      zoomController?.destroy();
      zoomController = null;
    };

    const mount = () => {
      cleanup();
      const container = containerRef.value;
      const canvas = canvasRef.value;
      if (!container || !canvas) return;

      const store = props.store ?? contextStore;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const view = new MainKlineView(ctx, store);
      viewInstance = view;
      mainKlineView.value = view;

      scrollController = new ScrollController(store, bus, "main");
      yScrollController = new YScrollController(store, bus, "main");
      zoomController = new ZoomController(store, bus, "main");

      detachHost = attachCanvasViewHost({
        container,
        canvas,
        view,
        store,
        pointer: { viewId: "main", bus, mode: "chart" },
      });
    };

    watch(
      () => [props.store ?? contextStore, bus, containerRef.value, canvasRef.value] as const,
      () => {
        if (containerRef.value && canvasRef.value) {
          mount();
        }
      },
      { flush: "post", immediate: true },
    );

    onBeforeUnmount(cleanup);

    return () => {
      const children: VNode[] = [
        h(
          "div",
          {
            id: "kline-view",
            ref: containerRef,
            style: { width: "100%", height: "100%", minWidth: 0 },
          },
          [
            h("canvas", {
              id: "kline-canvas",
              ref: canvasRef,
              style: {
                display: "block",
                width: "100%",
                height: "100%",
                touchAction: "none",
              },
            }),
          ],
        ),
      ];

      if (mainKlineView.value) {
        children.push(
          h(
            LayerRendererRoot,
            { view: mainKlineView.value },
            { default: () => slots.default?.() },
          ),
        );
      }

      return children;
    };
  },
});

export default KlineView;
