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
import {
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode,
  type VNodeChild,
} from "vue";

import { useKlineEventBus } from "../../../context/useKlineEventBus";
import { useKlineStore } from "../../../context/useKlineStore";
import { LayerRendererRoot } from "../../../renderer/LayerRendererRoot";

export const IndicatorView = defineComponent({
  name: "IndicatorView",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>> | undefined>,
      default: undefined,
    },
    paneId: {
      type: String,
      required: true,
    },
    indicatorName: {
      type: String,
      required: true,
    },
    calcParams: {
      type: Object as PropType<IndicatorCalcParams>,
      required: true,
    },
    layerChildren: {
      type: [Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
  },
  setup(props) {
    const contextStore = useKlineStore();
    const bus = useKlineEventBus();
    const containerRef = ref<HTMLDivElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const view = shallowRef<GenericIndicatorView | null>(null);

    let detachHost: (() => void) | null = null;
    let scrollController: ScrollController | null = null;
    let zoomController: ZoomController | null = null;
    let viewInstance: GenericIndicatorView | null = null;

    const cleanup = () => {
      detachHost?.();
      detachHost = null;
      viewInstance?.destroy();
      viewInstance = null;
      view.value = null;
      scrollController?.destroy();
      scrollController = null;
      zoomController?.destroy();
      zoomController = null;
    };

    const mount = () => {
      cleanup();
      const container = containerRef.value;
      const canvas = canvasRef.value;
      if (!container || !canvas) return;

      const descriptor = getIndicator(props.indicatorName);
      if (!descriptor) {
        throw new Error(
          `[keisen] Unknown indicator "${props.indicatorName}". Call registerIndicator first.`,
        );
      }

      const store = props.store ?? contextStore;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const indicatorView = new GenericIndicatorView(ctx, store, {
        paneId: props.paneId,
        descriptor,
      });
      indicatorView.setCalcParams(props.calcParams);
      viewInstance = indicatorView;
      view.value = indicatorView;

      scrollController = new ScrollController(store, bus, props.paneId);
      zoomController = new ZoomController(store, bus, props.paneId);

      detachHost = attachCanvasViewHost({
        container,
        canvas,
        view: indicatorView,
        store,
        pointer: { viewId: props.paneId, bus, mode: "chart" },
      });
    };

    watch(
      () =>
        [
          props.store ?? contextStore,
          bus,
          props.paneId,
          props.indicatorName,
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

    watch(
      () => props.calcParams,
      (calcParams) => {
        viewInstance?.setCalcParams(calcParams);
      },
    );

    onBeforeUnmount(cleanup);

    return () => {
      const children: VNode[] = [
        h(
          "div",
          {
            id: `${props.paneId}-view`,
            ref: containerRef,
            style: { width: "100%", height: "100%", minWidth: 0 },
          },
          [
            h("canvas", {
              id: `${props.paneId}-canvas`,
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

      if (view.value) {
        children.push(
          h(
            LayerRendererRoot,
            { view: view.value },
            {
              default: () => props.layerChildren as VNodeChild,
            },
          ),
        );
      }

      return children;
    };
  },
});
