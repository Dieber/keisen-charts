import type { LayerComponent } from "../reconciler/types";

export type KlineCandlesProps = Record<string, never>;

export const KlineCandles: LayerComponent<KlineCandlesProps> = () => null;
KlineCandles.layerType = "KlineCandles";
