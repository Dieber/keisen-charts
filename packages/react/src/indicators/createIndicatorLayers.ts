import {
  registerFigureLayerType,
  type IndicatorFigure,
} from "@keisen-charts/core";

import type { LayerComponent } from "../reconciler/types";

const layerComponentCache = new Map<
  string,
  LayerComponent<Record<string, unknown>>
>();

/**
 * 为 figure 注册 layerType 工厂，并返回可复用的 React Layer 组件。
 */
export const createFigureLayerComponent = (
  indicatorName: string,
  figure: IndicatorFigure,
): LayerComponent<Record<string, unknown>> => {
  const layerType = registerFigureLayerType(indicatorName, figure);

  const cached = layerComponentCache.get(layerType);
  if (cached) return cached;

  const Component: LayerComponent<Record<string, unknown>> = () => null;
  Component.layerType = layerType;
  layerComponentCache.set(layerType, Component);
  return Component;
};

export const getCachedLayerComponent = (
  layerType: string,
): LayerComponent<Record<string, unknown>> | undefined =>
  layerComponentCache.get(layerType);
