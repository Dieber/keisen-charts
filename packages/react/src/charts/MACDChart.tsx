import type { ReactNode } from "react";

import { ensureBuiltinIndicatorCharts, MACDChart as BuiltinMACDChart } from "../indicators/registerBuiltinIndicators";
import { registerLayers } from "../layers/registerLayers";

registerLayers();
ensureBuiltinIndicatorCharts();

export type MACDChartProps = {
  children?: ReactNode;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
};

export const MACDChart = (props: MACDChartProps) => (
  <BuiltinMACDChart {...props} />
);

MACDChart.displayName = "MACDChart";
