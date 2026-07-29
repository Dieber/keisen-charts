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
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

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

export type ChartSlotMap = Partial<Record<SubChartSlot, ReactNode>> & {
  main: ReactNode | null;
};

const getChartSlot = (child: ReactElement): "main" | SubChartSlot | null => {
  const type = child.type;
  if (typeof type === "function" && "displayName" in type) {
    const name = (type as { displayName?: string }).displayName;
    return resolveChartSlot(name);
  }
  return null;
};

export const partitionChartChildren = (children: ReactNode): ChartSlotMap => {
  const slots: ChartSlotMap = { main: null };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const slot = getChartSlot(child);
    if (!slot) return;
    if (slot === "main") {
      slots.main = child;
      return;
    }
    slots[slot] = child;
  });

  return slots;
};

export const getRequestedSubSlots = (slots: ChartSlotMap): SubChartSlot[] =>
  getRequestedSubSlotsCore(slots);
