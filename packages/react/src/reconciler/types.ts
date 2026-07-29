import type { LayerHostView as CoreLayerHostView } from "@keisen-charts/core";

export type LayerHostView = CoreLayerHostView;

export type { LayerContainer } from "@keisen-charts/core";

export type LayerComponent<P = Record<string, unknown>> = ((
  props: P,
) => null) & {
  layerType: string;
};
