import {
  ChartDataController,
  type ChartDataState,
  type GetDataFn,
  type KlineBar,
  type KeisenState,
  type OnSubscribeFn,
  type Resolution,
  type Store,
} from "@keisen-charts/core";
import { defineComponent, onBeforeUnmount, watch, type PropType } from "vue";

export const DataController = defineComponent({
  name: "DataController",
  props: {
    store: {
      type: Object as PropType<Store<KeisenState<ChartDataState>>>,
      required: true,
    },
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
  },
  setup(props) {
    let controller: ChartDataController | null = null;
    let boundStore: Store<KeisenState<ChartDataState>> | null = null;

    watch(
      () =>
        [
          props.store,
          props.data,
          props.getData,
          props.onSubscribe,
          props.resolution,
          props.symbol,
        ] as const,
      () => {
        if (!controller || boundStore !== props.store) {
          controller?.dispose();
          boundStore = props.store;
          controller = new ChartDataController(props.store, {
            data: props.data,
            getData: props.getData,
            onSubscribe: props.onSubscribe,
            resolution: props.resolution,
            symbol: props.symbol,
          });
          return;
        }

        controller.setOptions({
          data: props.data,
          getData: props.getData,
          onSubscribe: props.onSubscribe,
          resolution: props.resolution,
          symbol: props.symbol,
        });
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      controller?.dispose();
      controller = null;
    });

    return () => null;
  },
});
