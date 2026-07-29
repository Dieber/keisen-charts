import {
  klineYAxisConfig,
  klineYZoomConfig,
} from "@keisen-charts/core";

import { YAxisPaneView } from "../y-axis-pane/YAxisPaneView";

export const KlineYAxisPane = () => (
  <YAxisPaneView
    config={klineYAxisConfig}
    zoomConfig={klineYZoomConfig}
    elementId="kline-y-axis"
  />
);
