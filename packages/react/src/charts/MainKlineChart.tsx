import type { ReactNode } from "react";

import { registerLayers } from "../layers";
import { KlineCandles } from "../layers/KlineCandles";
import KlineView from "../panes/main-kline-pane/view/KlineView";

registerLayers();

export type MainKlineChartProps = {
  children?: ReactNode;
};

export const MainKlineChart = ({
  children,
}: MainKlineChartProps) => {
  const effectiveChildren = children ?? <KlineCandles />;
  return <KlineView layerChildren={effectiveChildren} />;
};

MainKlineChart.displayName = "MainKlineChart";
