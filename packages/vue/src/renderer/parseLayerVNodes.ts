import type { LayerDescriptor } from "@keisen-charts/core";
import {
  Comment,
  Fragment,
  Text,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
} from "vue";

import { getFlattenNodes } from "./flattenNodes";
import type { LayerComponentLike } from "./types";

const isVNode = (node: VNodeChild): node is VNode =>
  typeof node === "object" &&
  node !== null &&
  !Array.isArray(node) &&
  "type" in node;

const normalizeChildren = (
  children: VNodeChild | VNodeArrayChildren,
): VNodeChild[] => {
  if (children == null || children === false || children === true) return [];
  if (Array.isArray(children)) {
    return children.flatMap((child) =>
      normalizeChildren(child as VNodeChild),
    );
  }
  return [children];
};

const getLayerType = (type: VNode["type"]): string | null => {
  if (typeof type === "object" && type !== null && "layerType" in type) {
    const layerType = (type as LayerComponentLike).layerType;
    return typeof layerType === "string" ? layerType : null;
  }
  return null;
};

/**
 * Parse Vue slot VNodes into core LayerDescriptors.
 */
export const parseLayerVNodes = (
  children: VNodeChild | VNodeArrayChildren | undefined,
): LayerDescriptor[] => {
  const nodes = normalizeChildren(children ?? []);
  const descriptors: LayerDescriptor[] = [];

  nodes.forEach((child, index) => {
    if (!isVNode(child)) return;
    if (child.type === Comment || child.type === Text) return;

    const flatten = getFlattenNodes(child);
    if (flatten) {
      descriptors.push(...parseLayerVNodes(flatten));
      return;
    }

    if (child.type === Fragment) {
      descriptors.push(
        ...parseLayerVNodes(child.children as VNodeArrayChildren),
      );
      return;
    }

    const layerType = getLayerType(child.type);
    if (!layerType) return;

    const key =
      child.key != null ? String(child.key) : `${layerType}-${index}`;

    const props = { ...(child.props as Record<string, unknown> | null) };
    delete props.key;

    descriptors.push({
      key,
      layerType,
      props,
    });
  });

  return descriptors;
};
