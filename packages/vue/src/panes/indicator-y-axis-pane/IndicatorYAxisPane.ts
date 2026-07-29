import {
  createPaneYAxisConfig,
  createPaneYZoomConfig,
  formatIndicatorTick,
  fromSimpleFormatter,
  getIndicator,
  listIndicators,
  type PriceFormatter,
} from "@keisen-charts/core";
import { defineComponent, h } from "vue";

import { YAxisPaneView } from "../y-axis-pane/YAxisPaneView";

const resolveFormatTick = (paneId: string): PriceFormatter => {
  const byName = getIndicator(paneId.toUpperCase());
  if (byName?.formatTick) {
    return fromSimpleFormatter(byName.formatTick);
  }
  const match = listIndicators().find(
    (d) => d.name.toLowerCase() === paneId.toLowerCase(),
  );
  if (match?.formatTick) {
    return fromSimpleFormatter(match.formatTick);
  }
  return formatIndicatorTick;
};

export const IndicatorYAxisPane = defineComponent({
  name: "IndicatorYAxisPane",
  props: {
    paneId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(YAxisPaneView, {
        config: createPaneYAxisConfig(props.paneId, {
          formatTick: resolveFormatTick(props.paneId),
        }),
        zoomConfig: createPaneYZoomConfig(props.paneId),
        elementId: `${props.paneId}-y-axis`,
      });
  },
});
