import type { LayerComponent } from "../reconciler/types";

export type EMAProps = {
  period: number;
  color?: string;
};

export const EMA: LayerComponent<EMAProps> = () => null;
EMA.layerType = "EMA";
