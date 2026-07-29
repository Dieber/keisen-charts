import type { LayerComponent } from "../reconciler/types";

export type SMMAProps = {
  period: number;
  color?: string;
};

export const SMMA: LayerComponent<SMMAProps> = () => null;
SMMA.layerType = "SMMA";
