import type { ReactNode } from "react";

import {
  ensureBuiltinIndicatorCharts,
  VolumeChart as BuiltinVolumeChart,
} from "../indicators/registerBuiltinIndicators";
import { registerLayers } from "../layers/registerLayers";

registerLayers();
ensureBuiltinIndicatorCharts();

export type VolumeChartProps = {
  children?: ReactNode;
  /** 成交量均线周期，默认 [5, 10, 20] */
  maPeriods?: number[];
  [key: string]: unknown;
};

export const VolumeChart = (props: VolumeChartProps) => (
  <BuiltinVolumeChart {...props} />
);

VolumeChart.displayName = "VolumeChart";
