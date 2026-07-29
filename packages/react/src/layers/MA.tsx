import type { LayerComponent } from "../reconciler/types";

export type MAProps = {
  period: number;
  color?: string;
};

export const MA: LayerComponent<MAProps> = () => null;
MA.layerType = "MA";
