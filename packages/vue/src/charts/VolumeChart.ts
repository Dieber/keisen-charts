import { defineComponent, h } from "vue";

import {
  ensureBuiltinIndicatorCharts,
  VolumeChart as BuiltinVolumeChart,
} from "../indicators/registerBuiltinIndicators";
import { registerLayers } from "../layers/registerLayers";

registerLayers();
ensureBuiltinIndicatorCharts();

export const VolumeChart = defineComponent({
  name: "VolumeChart",
  setup(_props, { slots, attrs }) {
    return () =>
      h(
        BuiltinVolumeChart,
        { ...attrs },
        slots,
      );
  },
});

(VolumeChart as typeof VolumeChart & { displayName: string }).displayName =
  "VolumeChart";
