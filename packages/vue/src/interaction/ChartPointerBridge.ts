import {
  ChartPointerController,
  type ChartDataState,
  type ChartPointerInfo,
  type EventBus,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";
import {
  defineComponent,
  onBeforeUnmount,
  watch,
  type PropType,
} from "vue";

export const ChartPointerBridge = defineComponent({
  name: "ChartPointerBridge",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>>>,
      required: true,
    },
    bus: {
      type: Object as PropType<EventBus>,
      required: true,
    },
    onPointerMove: {
      type: Function as PropType<
        ((info: ChartPointerInfo | null) => void) | undefined
      >,
      default: undefined,
    },
    onPointerDown: {
      type: Function as PropType<
        ((info: ChartPointerInfo) => void) | undefined
      >,
      default: undefined,
    },
    onPointerUp: {
      type: Function as PropType<
        ((info: ChartPointerInfo) => void) | undefined
      >,
      default: undefined,
    },
    onClick: {
      type: Function as PropType<
        ((info: ChartPointerInfo) => void) | undefined
      >,
      default: undefined,
    },
  },
  setup(props) {
    let controller: ChartPointerController | null = null;

    const syncHandlers = () => {
      controller?.setHandlers({
        onPointerMove: props.onPointerMove,
        onPointerDown: props.onPointerDown,
        onPointerUp: props.onPointerUp,
        onClick: props.onClick,
      });
    };

    watch(
      () => [props.store, props.bus] as const,
      () => {
        controller?.destroy();
        controller = new ChartPointerController(props.store, props.bus, {
          onPointerMove: props.onPointerMove,
          onPointerDown: props.onPointerDown,
          onPointerUp: props.onPointerUp,
          onClick: props.onClick,
        });
      },
      { immediate: true },
    );

    watch(
      () =>
        [
          props.onPointerMove,
          props.onPointerDown,
          props.onPointerUp,
          props.onClick,
        ] as const,
      () => syncHandlers(),
    );

    onBeforeUnmount(() => {
      controller?.destroy();
      controller = null;
    });

    return () => null;
  },
});
