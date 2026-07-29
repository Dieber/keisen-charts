import type { LayerComponent } from "../reconciler/types";

export type BOLLProps = {
  period?: number;
  stdDev?: number;
  upperColor?: string;
  middleColor?: string;
  lowerColor?: string;
};

export const BOLL: LayerComponent<BOLLProps> = () => null;
BOLL.layerType = "BOLL";
