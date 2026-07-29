import {
  buildDefaultSubPaneWeights,
  buildGridRows,
  getChartDisplayNames,
  getRequestedSubSlots as getRequestedSubSlotsCore,
  getSubChartOrder,
  getSubPanePlacements,
  getXAxisRow,
  reconcileSubPaneWeights,
  registerChartSlot,
  resolveChartSlot,
  BUILTIN_SUB_CHART_ORDER,
  DEFAULT_SUB_PANE_WEIGHT,
  type BuildGridRowsInput,
  type PaneGridPlacement,
  type SubChartSlot,
} from "@keisen-charts/core";
import {
  Comment,
  Fragment,
  Text,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
} from "vue";

import { getFlattenNodes } from "../renderer/flattenNodes";

export type { SubChartSlot, BuildGridRowsInput, PaneGridPlacement };
export {
  BUILTIN_SUB_CHART_ORDER,
  DEFAULT_SUB_PANE_WEIGHT,
  registerChartSlot,
  getChartDisplayNames,
  getSubChartOrder,
  buildDefaultSubPaneWeights,
  reconcileSubPaneWeights,
  buildGridRows,
  getSubPanePlacements,
  getXAxisRow,
};

export type ChartSlotMap = Partial<Record<SubChartSlot, VNode>> & {
  main: VNode | null;
};

const isVNode = (node: VNodeChild): node is VNode =>
  typeof node === "object" && node !== null && !Array.isArray(node) && "type" in node;

const normalizeChildren = (children: VNodeChild | VNodeArrayChildren): VNodeChild[] => {
  if (children == null || children === false || children === true) return [];
  if (Array.isArray(children)) {
    return children.flatMap((child) => normalizeChildren(child as VNodeChild));
  }
  return [children];
};

const getComponentDisplayName = (type: VNode["type"]): string | null => {
  if (typeof type === "object" && type !== null) {
    const record = type as { displayName?: string; name?: string };
    if (typeof record.displayName === "string") return record.displayName;
    if (typeof record.name === "string") return record.name;
  }
  if (typeof type === "function") {
    const record = type as { displayName?: string; name?: string };
    if (typeof record.displayName === "string") return record.displayName;
    if (typeof record.name === "string" && record.name.length > 0) return record.name;
  }
  return null;
};

const getChartSlot = (child: VNode): "main" | SubChartSlot | null => {
  const name = getComponentDisplayName(child.type);
  return name ? resolveChartSlot(name) : null;
};

export const partitionChartVNodes = (
  children: VNodeChild | VNodeArrayChildren | undefined,
): ChartSlotMap => {
  const slots: ChartSlotMap = { main: null };

  for (const child of normalizeChildren(children ?? [])) {
    if (!isVNode(child)) continue;
    if (child.type === Comment || child.type === Text) continue;

    const flatten = getFlattenNodes(child);
    if (flatten) {
      const nested = partitionChartVNodes(flatten);
      if (nested.main) slots.main = nested.main;
      for (const [key, value] of Object.entries(nested)) {
        if (key === "main" || value == null) continue;
        slots[key as SubChartSlot] = value as VNode;
      }
      continue;
    }

    if (child.type === Fragment) {
      const nested = partitionChartVNodes(child.children as VNodeArrayChildren);
      if (nested.main) slots.main = nested.main;
      for (const [key, value] of Object.entries(nested)) {
        if (key === "main" || value == null) continue;
        slots[key as SubChartSlot] = value as VNode;
      }
      continue;
    }

    const slot = getChartSlot(child);
    if (!slot) continue;
    if (slot === "main") {
      slots.main = child;
      continue;
    }
    slots[slot] = child;
  }

  return slots;
};

export const getRequestedSubSlots = (slots: ChartSlotMap): SubChartSlot[] =>
  getRequestedSubSlotsCore(slots);

export const hasMainKlineChart = (
  children: VNodeChild | VNodeArrayChildren | undefined,
): boolean => {
  for (const child of normalizeChildren(children ?? [])) {
    if (!isVNode(child)) continue;
    const flatten = getFlattenNodes(child);
    if (flatten) {
      if (hasMainKlineChart(flatten)) return true;
      continue;
    }
    if (child.type === Fragment) {
      if (hasMainKlineChart(child.children as VNodeArrayChildren)) return true;
      continue;
    }
    const name = getComponentDisplayName(child.type);
    if (name === "MainKlineChart") return true;
  }
  return false;
};
