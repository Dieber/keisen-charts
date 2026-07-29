import { defineComponent, type Component } from "vue";

import type { LayerComponent } from "./types";

/**
 * Create a null-render Layer marker component with a static layerType.
 */
export const createVueLayerComponent = (
  layerType: string,
  propDefs?: Record<string, unknown>,
): LayerComponent => {
  const Component = defineComponent({
    name: layerType,
    props: propDefs ?? {},
    setup() {
      return () => null;
    },
  }) as unknown as LayerComponent;

  Component.layerType = layerType;
  return Component;
};

export const attachLayerType = <T extends Component>(
  component: T,
  layerType: string,
): T & { layerType: string } => {
  const withType = component as T & { layerType: string };
  withType.layerType = layerType;
  return withType;
};
