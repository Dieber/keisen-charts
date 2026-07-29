import {
  clearMountedLayers,
  reconcileLayerDescriptors,
  type LayerContainer,
  type LayerHostView,
  type LayerReconcileState,
} from "@keisen-charts/core";
import {
  defineComponent,
  onBeforeUnmount,
  watch,
  type PropType,
  type VNodeChild,
} from "vue";

import { parseLayerVNodes } from "./parseLayerVNodes";

/**
 * Reconcile Layer slot VNodes into core layers. Renders nothing.
 */
export const LayerRendererRoot = defineComponent({
  name: "LayerRendererRoot",
  props: {
    view: {
      type: Object as PropType<LayerHostView>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const hostContainer: LayerContainer = {
      view: props.view,
      onCommit: () => props.view.requestRender?.(),
    };
    const reconcileState: LayerReconcileState = {
      mounted: [],
      previousProps: new Map(),
    };

    const runReconcile = () => {
      hostContainer.view = props.view;
      hostContainer.onCommit = () => props.view.requestRender?.();
      const children = slots.default?.() as VNodeChild[] | undefined;
      reconcileLayerDescriptors(
        hostContainer,
        parseLayerVNodes(children),
        reconcileState,
      );
    };

    watch(
      () => [props.view, slots.default?.()] as const,
      () => {
        runReconcile();
      },
      { immediate: true, flush: "post" },
    );

    onBeforeUnmount(() => {
      clearMountedLayers(hostContainer, reconcileState);
    });

    return () => null;
  },
});
