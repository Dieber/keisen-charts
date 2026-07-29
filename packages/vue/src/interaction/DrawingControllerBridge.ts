import {
  DrawingController,
  type ChartDataState,
  type EventBus,
  type KeisenState,
  type Store,
} from "@keisen-charts/core";
import { defineComponent, onBeforeUnmount, watch, type PropType } from "vue";

export const DrawingControllerBridge = defineComponent({
  name: "DrawingControllerBridge",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>>>,
      required: true,
    },
    bus: {
      type: Object as PropType<EventBus>,
      required: true,
    },
  },
  setup(props) {
    let controller: DrawingController | null = null;

    watch(
      () => [props.store, props.bus] as const,
      () => {
        controller?.destroy();
        controller = new DrawingController(props.store, props.bus);
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      controller?.destroy();
      controller = null;
    });

    return () => null;
  },
});
