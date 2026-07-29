import type {
  ChartDataState,
  KeisenState,
  Store,
} from "@keisen-charts/core";

import type { LayerComponent } from "../reconciler/types";

export type DrawingsProps = {
  paneId?: string;
  /** 由 useDrawOverlay / DrawingHost 注入；稳定引用，不会因 props 变化 remount */
  store: Store<KeisenState<ChartDataState>>;
};

export const Drawings: LayerComponent<DrawingsProps> = () => null;
Drawings.layerType = "Drawings";
