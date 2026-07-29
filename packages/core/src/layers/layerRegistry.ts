type CoreLayer = {
  id: string;
  zIndex: number;
};

export type LayerFactory = (props: Record<string, unknown>) => CoreLayer;

export type LayerRegistration = {
  createCoreLayer: LayerFactory;
};

const registry = new Map<string, LayerRegistration>();

export const registerLayerType = (
  layerType: string,
  registration: LayerRegistration,
): void => {
  registry.set(layerType, registration);
};

export const createCoreLayer = (
  layerType: string,
  props: Record<string, unknown>,
): CoreLayer => {
  const registration = registry.get(layerType);
  if (!registration) {
    throw new Error(`[keisen] Unknown layer type: ${layerType}`);
  }
  return registration.createCoreLayer(props);
};

export const isRegisteredLayerType = (layerType: string): boolean =>
  registry.has(layerType);

/** 测试用：清空 registry */
export const clearLayerRegistry = (): void => {
  registry.clear();
};
