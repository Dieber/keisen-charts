import { defineComponent, h } from "vue";

import {
  ensureBuiltinIndicatorCharts,
  MACDChart as BuiltinMACDChart,
} from "../indicators/registerBuiltinIndicators";
import { registerLayers } from "../layers/registerLayers";

registerLayers();
ensureBuiltinIndicatorCharts();

export const MACDChart = defineComponent({
  name: "MACDChart",
  props: {
    fastPeriod: Number,
    slowPeriod: Number,
    signalPeriod: Number,
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        BuiltinMACDChart,
        {
          ...attrs,
          fastPeriod: props.fastPeriod,
          slowPeriod: props.slowPeriod,
          signalPeriod: props.signalPeriod,
        },
        slots,
      );
  },
});

(MACDChart as typeof MACDChart & { displayName: string }).displayName =
  "MACDChart";
