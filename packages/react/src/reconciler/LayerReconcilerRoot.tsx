import {
  clearMountedLayers,
  reconcileLayerDescriptors,
  type LayerContainer,
  type LayerDescriptor,
  type LayerHostView,
  type LayerReconcileState,
  type MountedLayer,
} from "@keisen-charts/core";
import {
  Children,
  Fragment,
  createElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

import type { LayerComponent } from "./types";

const parseLayerChildren = (children: ReactNode): LayerDescriptor[] =>
  Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement(child)) return [];

    // 展开 <>...</>，否则默认 LayerChildren 会整段被跳过
    if (child.type === Fragment) {
      return parseLayerChildren(
        (child.props as { children?: ReactNode }).children,
      );
    }

    const type = child.type as LayerComponent;
    if (typeof type !== "function" || !type.layerType) return [];

    const key =
      child.key != null ? String(child.key) : `${type.layerType}-${index}`;

    return [
      {
        key,
        layerType: type.layerType,
        props: { ...(child.props as Record<string, unknown>) },
      },
    ];
  });

/**
 * 将 React Layer JSX 解析为 descriptor 后交给 core reconcile。
 */
export const reconcileLayerTree = (
  container: LayerContainer,
  children: ReactNode,
  mountedRef: { current: MountedLayer[] },
  prevPropsRef: { current: Map<string, Record<string, unknown>> },
): void => {
  const state: LayerReconcileState = {
    mounted: mountedRef.current,
    previousProps: prevPropsRef.current,
  };
  reconcileLayerDescriptors(container, parseLayerChildren(children), state);
  mountedRef.current = state.mounted;
};

type LayerReconcilerRootProps = {
  view: LayerHostView;
  children: ReactNode;
};

export const LayerReconcilerRoot = ({
  view,
  children,
}: LayerReconcilerRootProps) => {
  const hostContainerRef = useRef<LayerContainer | null>(null);
  const reconcileStateRef = useRef<LayerReconcileState>({
    mounted: [],
    previousProps: new Map(),
  });

  if (!hostContainerRef.current) {
    hostContainerRef.current = {
      view,
      onCommit: () => view.requestRender?.(),
    };
  } else {
    hostContainerRef.current.view = view;
    hostContainerRef.current.onCommit = () => view.requestRender?.();
  }

  useLayoutEffect(() => {
    const hostContainer = hostContainerRef.current;
    if (!hostContainer) return;

    const element = createElement(Fragment, null, children);
    reconcileLayerDescriptors(
      hostContainer,
      parseLayerChildren(element.props.children as ReactNode),
      reconcileStateRef.current,
    );

    return () => {
      clearMountedLayers(hostContainer, reconcileStateRef.current);
    };
  }, [children, view]);

  return null;
};
