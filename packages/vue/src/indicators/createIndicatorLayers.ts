import {
  registerFigureLayerType,
  type IndicatorFigure,
} from "@keisen-charts/core";

import { createVueLayerComponent } from "../renderer/createVueLayerComponent";
import type { LayerComponent } from "../renderer/types";

const layerComponentCache = new Map<string, LayerComponent>();

/**
 * Register figure layerType factory and return a reusable Vue Layer marker.
 */
export const createFigureLayerComponent = (
  indicatorName: string,
  figure: IndicatorFigure,
): LayerComponent => {
  const layerType = registerFigureLayerType(indicatorName, figure);

  const cached = layerComponentCache.get(layerType);
  if (cached) return cached;

  const Component = createVueLayerComponent(layerType);
  layerComponentCache.set(layerType, Component);
  return Component;
};

export const getCachedLayerComponent = (
  layerType: string,
): LayerComponent | undefined => layerComponentCache.get(layerType);
