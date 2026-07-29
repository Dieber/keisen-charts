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
import type { Component } from "vue";

import { createFigureLayerComponent } from "./createIndicatorLayers";
import {
  createIndicatorChart,
  type IndicatorChartProps,
} from "./createIndicatorChart";
import type { LayerComponent } from "../renderer/types";

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

export const VolumeChart: Component<IndicatorChartProps> =
  createIndicatorChart("VOLUME", { paneId: "volume" });
(VolumeChart as Component & { displayName: string }).displayName = "VolumeChart";

export const MACDChart: Component<IndicatorChartProps> =
  createIndicatorChart("MACD");
export const RSIChart: Component<IndicatorChartProps> =
  createIndicatorChart("RSI");
export const KDJChart: Component<IndicatorChartProps> =
  createIndicatorChart("KDJ");
export const OBVChart: Component<IndicatorChartProps> =
  createIndicatorChart("OBV");
export const CCIChart: Component<IndicatorChartProps> =
  createIndicatorChart("CCI");
export const WRChart: Component<IndicatorChartProps> =
  createIndicatorChart("WR");
export const DMIChart: Component<IndicatorChartProps> =
  createIndicatorChart("DMI");
export const MTMChart: Component<IndicatorChartProps> =
  createIndicatorChart("MTM");

export const VOL = createFigureLayerComponent(
  "VOLUME",
  VOLUME_DESCRIPTOR.figures[0]!,
) as LayerComponent;

export const MAVOL = createFigureLayerComponent("VOLUME", {
  key: "ma5",
  type: "line",
  layerType: "MAVOL",
}) as LayerComponent;

export const DIF = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const DEA = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[1]!,
) as LayerComponent;
export const MACD = createFigureLayerComponent(
  "MACD",
  MACD_DESCRIPTOR.figures[2]!,
) as LayerComponent;

export const RSI = createFigureLayerComponent("RSI", {
  key: "rsi_6",
  type: "line",
  layerType: "RSI",
}) as LayerComponent;

export const K = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const D = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[1]!,
) as LayerComponent;
export const J = createFigureLayerComponent(
  "KDJ",
  KDJ_DESCRIPTOR.figures[2]!,
) as LayerComponent;

export const OBV = createFigureLayerComponent(
  "OBV",
  OBV_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const MAOBV = createFigureLayerComponent(
  "OBV",
  OBV_DESCRIPTOR.figures[1]!,
) as LayerComponent;

export const CCI = createFigureLayerComponent(
  "CCI",
  CCI_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const WR = createFigureLayerComponent(
  "WR",
  WR_DESCRIPTOR.figures[0]!,
) as LayerComponent;

export const PDI = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const MDI = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[1]!,
) as LayerComponent;
export const ADX = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[2]!,
) as LayerComponent;
export const ADXR = createFigureLayerComponent(
  "DMI",
  DMI_DESCRIPTOR.figures[3]!,
) as LayerComponent;

export const MTM = createFigureLayerComponent(
  "MTM",
  MTM_DESCRIPTOR.figures[0]!,
) as LayerComponent;
export const MAMTM = createFigureLayerComponent(
  "MTM",
  MTM_DESCRIPTOR.figures[1]!,
) as LayerComponent;

export const ensureBuiltinIndicatorCharts = (): void => {
  initBuiltins();
};
