import type { LayerComponent } from "../reconciler/types";

export type SARProps = {
  start?: number;
  step?: number;
  max?: number;
  color?: string;
};

export const SAR: LayerComponent<SARProps> = () => null;
SAR.layerType = "SAR";
