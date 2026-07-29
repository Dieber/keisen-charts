import {
  registerBuiltinIndicators as registerBuiltinDescriptors,
  MACD_DESCRIPTOR,
  RSI_DESCRIPTOR,
  KDJ_DESCRIPTOR,
  OBV_DESCRIPTOR,
  CCI_DESCRIPTOR,
  WR_DESCRIPTOR,
  DMI_DESCRIPTOR,
  MTM_DESCRIPTOR,
  VOLUME_DESCRIPTOR,
  type IndicatorFigure,
} from "@keisen-charts/core";
import type { ComponentType } from "react";

import { createFigureLayerComponent } from "./createIndicatorLayers";
import {
  createIndicatorChart,
  type IndicatorChartProps,
} from "./createIndicatorChart";
import type { LayerComponent } from "../reconciler/types";

let registered = false;

const ensureFigureLayers = (
  name: string,
  figures: IndicatorFigure[],
): void => {
  for (const figure of figures) {
    createFigureLayerComponent(name, figure);
  }
};

const initBuiltins = () => {
  if (registered) return;
  registered = true;

  registerBuiltinDescriptors();

  ensureFigureLayers("VOLUME", VOLUME_DESCRIPTOR.figures);
  ensureFigureLayers("MACD", MACD_DESCRIPTOR.figures);
  ensureFigureLayers("RSI", RSI_DESCRIPTOR.figures);
  ensureFigureLayers("KDJ", KDJ_DESCRIPTOR.figures);
  ensureFigureLayers("OBV", OBV_DESCRIPTOR.figures);
  ensureFigureLayers("CCI", CCI_DESCRIPTOR.figures);
  ensureFigureLayers("WR", WR_DESCRIPTOR.figures);
  ensureFigureLayers("DMI", DMI_DESCRIPTOR.figures);
  ensureFigureLayers("MTM", MTM_DESCRIPTOR.figures);
};

initBuiltins();

export const VolumeChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("VOLUME", { paneId: "volume" });
VolumeChart.displayName = "VolumeChart";

export const MACDChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("MACD");
export const RSIChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("RSI");
export const KDJChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("KDJ");
export const OBVChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("OBV");
export const CCIChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("CCI");
export const WRChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("WR");
export const DMIChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("DMI");
export const MTMChart: ComponentType<IndicatorChartProps> =
  createIndicatorChart("MTM");

export const VOL = createFigureLayerComponent(
  "VOLUME",
  VOLUME_DESCRIPTOR.figures[0]!,
) as LayerComponent<{
  colorUp?: string;
  colorDown?: string;
  color?: string;
}>;

export const MAVOL = createFigureLayerComponent("VOLUME", {
  key: "ma5",
  type: "line",
  layerType: "MAVOL",
}) as LayerComponent<{ period: number; color?: string }>;

export const DIF = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const DEA = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[1]!,
) as LayerComponent<{ color?: string }>;
export const MACD = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[2]!,
) as LayerComponent<{
  colorUp?: string;
  colorDown?: string;
  color?: string;
}>;

export const RSI = createFigureLayerComponent("RSI", {
  key: "rsi_6",
  type: "line",
  layerType: "RSI",
}) as LayerComponent<{ period: number; color?: string }>;

export const K = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const D = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[1]!,
) as LayerComponent<{ color?: string }>;
export const J = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[2]!,
) as LayerComponent<{ color?: string }>;

export const OBV = createFigureLayerComponent(
  "OBV",
  OBV_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const MAOBV = createFigureLayerComponent(
  "OBV",
  OBV_DESCRIPTOR.figures[1]!,
) as LayerComponent<{ color?: string }>;

export const CCI = createFigureLayerComponent(
  "CCI",
  CCI_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const WR = createFigureLayerComponent(
  "WR",
  WR_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;

export const PDI = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const MDI = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[1]!,
) as LayerComponent<{ color?: string }>;
export const ADX = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[2]!,
) as LayerComponent<{ color?: string }>;
export const ADXR = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[3]!,
) as LayerComponent<{ color?: string }>;

export const MTM = createFigureLayerComponent(
  "MTM",
  MTM_DESCRIPTOR.figures[0]!,
) as LayerComponent<{ color?: string }>;
export const MAMTM = createFigureLayerComponent(
  "MTM",
  MTM_DESCRIPTOR.figures[1]!,
) as LayerComponent<{ color?: string }>;

export const ensureBuiltinIndicatorCharts = (): void => {
  initBuiltins();
};
