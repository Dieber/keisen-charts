import { klineYAxisConfig, klineYZoomConfig } from "@keisen-charts/core";
import { defineComponent, h } from "vue";

import { YAxisPaneView } from "../y-axis-pane/YAxisPaneView";

export const KlineYAxisPane = defineComponent({
  name: "KlineYAxisPane",
  setup() {
    return () =>
      h(YAxisPaneView, {
        config: klineYAxisConfig,
        zoomConfig: klineYZoomConfig,
        elementId: "kline-y-axis",
      });
  },
});
