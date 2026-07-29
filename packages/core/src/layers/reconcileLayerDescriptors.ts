import { createCoreLayer } from "./layerRegistry";

export type LayerDescriptor = {
  key: string;
  layerType: string;
  props: Record<string, unknown>;
};

export type MountedLayer = {
  key: string;
  coreLayerId: string;
};

/** 可挂载 Layer 的 View（主图 / 副图）；method 语法以兼容各 View 的 Layer 联合类型 */
export type LayerHostView = {
  addLayer(layer: { id: string; zIndex: number }): void;
  removeLayer(layerId: string): void;
  requestRender?: () => void;
};

export type LayerContainer = {
  view: LayerHostView;
  onCommit?: () => void;
};

export type LayerReconcileState = {
  mounted: MountedLayer[];
  previousProps: Map<string, Record<string, unknown>>;
};

export const propsEqual = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.is(a[key], b[key]));
};

const mountLayer = (
  container: LayerContainer,
  descriptor: LayerDescriptor,
): MountedLayer => {
  const coreLayer = createCoreLayer(descriptor.layerType, descriptor.props);
  container.view.addLayer(coreLayer);
  return { key: descriptor.key, coreLayerId: coreLayer.id };
};

/**
 * 将 LayerDescriptor[] 同步 diff 到 core Layer 栈。
 * props 变化视为 remove + insert（与现有 React 行为一致）。
 */
export const reconcileLayerDescriptors = (
  container: LayerContainer,
  nextDescriptors: LayerDescriptor[],
  state: LayerReconcileState,
): void => {
  const prevMounted = state.mounted;
  const prevProps = state.previousProps;

  const prevByKey = new Map(prevMounted.map((item) => [item.key, item]));
  const nextByKey = new Map(nextDescriptors.map((item) => [item.key, item]));

  for (const mounted of prevMounted) {
    if (!nextByKey.has(mounted.key)) {
      container.view.removeLayer(mounted.coreLayerId);
      prevProps.delete(mounted.key);
    }
  }

  const nextMounted: MountedLayer[] = [];

  for (const descriptor of nextDescriptors) {
    const prev = prevByKey.get(descriptor.key);
    const prevDescriptorProps = prevProps.get(descriptor.key);

    if (
      prev &&
      prevDescriptorProps &&
      propsEqual(prevDescriptorProps, descriptor.props)
    ) {
      nextMounted.push(prev);
      continue;
    }

    if (prev) {
      container.view.removeLayer(prev.coreLayerId);
    }

    const mounted = mountLayer(container, descriptor);
    nextMounted.push(mounted);
    prevProps.set(descriptor.key, { ...descriptor.props });
  }

  state.mounted = nextMounted;
  container.onCommit?.();
};

export const clearMountedLayers = (
  container: LayerContainer,
  state: LayerReconcileState,
): void => {
  for (const mounted of state.mounted) {
    container.view.removeLayer(mounted.coreLayerId);
  }
  state.mounted = [];
  state.previousProps.clear();
};
