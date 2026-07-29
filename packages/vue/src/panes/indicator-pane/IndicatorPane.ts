import type { IndicatorCalcParams } from "@keisen-charts/core";
import { defineComponent, h, type PropType, type VNodeChild } from "vue";

import { IndicatorView } from "./view/IndicatorView";

export const IndicatorPane = defineComponent({
  name: "IndicatorPane",
  props: {
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
    return () =>
      h(IndicatorView, {
        paneId: props.paneId,
        indicatorName: props.indicatorName,
        calcParams: props.calcParams,
        layerChildren: props.layerChildren,
      });
  },
});
