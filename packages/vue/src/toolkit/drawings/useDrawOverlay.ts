import {
  drawingsActions,
  DRAWING_TOOL_METAS,
  type Drawing,
  type DrawingPoint,
  type DrawingToolId,
  type DrawingToolMeta,
  type DrawingsState,
} from "@keisen-charts/core";
import {
  computed,
  watch,
  type ComputedRef,
} from "vue";

import { useKlineStore } from "../../context/useKlineStore";
import { useStoreSlice } from "../../composables/useStoreSlice";

export type DrawToolsToolbarProps = {
  tools: DrawingToolMeta[];
  activeTool: DrawingToolId | null;
  setOverlay: (tool: DrawingToolId | null) => void;
  clearDrawings: (paneId?: string) => void;
};

export type UseDrawOverlayOptions = {
  stickyTool?: boolean;
};

export type UseDrawOverlayResult = {
  activeTool: ComputedRef<DrawingToolId | null>;
  setOverlay: (tool: DrawingToolId | null) => void;
  drawings: ComputedRef<Drawing[]>;
  selectedIds: ComputedRef<string[]>;
  stickyTool: ComputedRef<boolean>;
  setStickyTool: (sticky: boolean) => void;
  addDrawing: (
    drawing: Omit<Drawing, "id" | "points"> & {
      id?: string;
      points: Array<Omit<DrawingPoint, "time"> & { time?: number }>;
    },
  ) => string;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: (paneId?: string) => void;
  serialize: () => string;
  hydrate: (json: string) => void;
  toolbarProps: ComputedRef<DrawToolsToolbarProps>;
};

const drawingsList = (state: DrawingsState): Drawing[] =>
  Object.values(state.items);

/**
 * 画线工具 composable。必须在 `KeisenChart`（Store Provider）内调用。
 *
 * - `setOverlay(tool)`：切到放置模式，鼠标在 pane 上点选落笔
 * - `addDrawing(...)`：程序化创建
 *
 * DrawingsLayer 已由 MainKlineView / GenericIndicatorView 自动挂载。
 */
export const useDrawOverlay = (
  options: UseDrawOverlayOptions = {},
): UseDrawOverlayResult => {
  const store = useKlineStore();
  const drawingsState = useStoreSlice(store, (state) => state.ui.drawings);

  watch(
    () => options.stickyTool,
    (stickyTool) => {
      if (stickyTool === undefined) return;
      if (stickyTool === store.getState().ui.drawings.stickyTool) return;
      drawingsActions.setStickyTool(store, stickyTool);
    },
    { immediate: true },
  );

  const setOverlay = (tool: DrawingToolId | null) => {
    drawingsActions.setActiveTool(store, tool);
  };

  const clearDrawings = (paneId?: string) => {
    drawingsActions.clearDrawings(store, paneId);
  };

  return {
    activeTool: computed(() => drawingsState.value.activeTool),
    setOverlay,
    drawings: computed(() => drawingsList(drawingsState.value)),
    selectedIds: computed(() => drawingsState.value.selectedIds),
    stickyTool: computed(() => drawingsState.value.stickyTool),
    setStickyTool: (sticky) => drawingsActions.setStickyTool(store, sticky),
    addDrawing: (drawing) => drawingsActions.addDrawing(store, drawing),
    updateDrawing: (id, patch) =>
      drawingsActions.updateDrawing(store, id, patch),
    removeDrawing: (id) => drawingsActions.removeDrawing(store, id),
    clearDrawings,
    serialize: () => drawingsActions.serialize(store),
    hydrate: (json) => drawingsActions.hydrate(store, json),
    toolbarProps: computed(() => ({
      tools: DRAWING_TOOL_METAS,
      activeTool: drawingsState.value.activeTool,
      setOverlay,
      clearDrawings,
    })),
  };
};
