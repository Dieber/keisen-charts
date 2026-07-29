import type { LayerHostView as CoreLayerHostView } from "@keisen-charts/core";
import type { Component, DefineComponent } from "vue";

export type LayerHostView = CoreLayerHostView;

export type { LayerContainer } from "@keisen-charts/core";

export type LayerComponent<P = Record<string, unknown>> = DefineComponent<P> & {
  layerType: string;
};

export type LayerComponentLike = Component & {
  layerType?: string;
};
