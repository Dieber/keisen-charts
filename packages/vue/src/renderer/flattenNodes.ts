import type { VNode, VNodeChild } from "vue";

import { KEISEN_FLATTEN_NODES } from "../components/VNodes";

/** 透明铺开组件（如 VNodes）：父级 slot 解析时应展开其 nodes */
export const getFlattenNodes = (child: VNode): VNodeChild[] | null => {
  const type = child.type;
  if (typeof type !== "object" || type === null) return null;
  if (!(KEISEN_FLATTEN_NODES in type) || !(type as Record<string, unknown>)[KEISEN_FLATTEN_NODES]) {
    return null;
  }
  const nodes = (child.props as { nodes?: VNodeChild[] } | null)?.nodes;
  return Array.isArray(nodes) ? nodes : null;
};
