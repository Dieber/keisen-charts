import {
  createPaneYAxisConfig,
  createPaneYZoomConfig,
  formatIndicatorTick,
  fromSimpleFormatter,
  getIndicator,
  listIndicators,
  type PriceFormatter,
} from "@keisen-charts/core";

import { YAxisPaneView } from "../y-axis-pane/YAxisPaneView";

export type IndicatorYAxisPaneProps = {
  paneId: string;
};

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

export const IndicatorYAxisPane = ({ paneId }: IndicatorYAxisPaneProps) => (
  <YAxisPaneView
    config={createPaneYAxisConfig(paneId, {
      formatTick: resolveFormatTick(paneId),
    })}
    zoomConfig={createPaneYZoomConfig(paneId)}
    elementId={`${paneId}-y-axis`}
  />
);
