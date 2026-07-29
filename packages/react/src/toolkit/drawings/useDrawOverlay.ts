import {
  drawingsActions,
  DRAWING_TOOL_METAS,
  type Drawing,
  type DrawingToolId,
  type DrawingToolMeta,
  type DrawingsState,
} from "@keisen-charts/core";
import { useEffect, useSyncExternalStore } from "react";

import { useKlineStore } from "../../context/KeisenStoreContext";

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
  activeTool: DrawingToolId | null;
  setOverlay: (tool: DrawingToolId | null) => void;
  drawings: Drawing[];
  selectedIds: string[];
  stickyTool: boolean;
  setStickyTool: (sticky: boolean) => void;
  addDrawing: (drawing: Omit<Drawing, "id"> & { id?: string }) => string;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: (paneId?: string) => void;
  serialize: () => string;
  hydrate: (json: string) => void;
  toolbarProps: DrawToolsToolbarProps;
};

const drawingsList = (state: DrawingsState): Drawing[] =>
  Object.values(state.items);

/**
 * 画线工具 hook。必须在 `KeisenChart`（Store Provider）内调用。
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

  const drawingsState = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.ui.drawings, onStoreChange),
    () => store.getState().ui.drawings,
    () => store.getState().ui.drawings,
  );

  useEffect(() => {
    if (options.stickyTool === undefined) return;
    if (options.stickyTool === store.getState().ui.drawings.stickyTool) return;
    drawingsActions.setStickyTool(store, options.stickyTool);
  }, [options.stickyTool, store]);

  const setOverlay = (tool: DrawingToolId | null) => {
    drawingsActions.setActiveTool(store, tool);
  };

  const clearDrawings = (paneId?: string) => {
    drawingsActions.clearDrawings(store, paneId);
  };

  return {
    activeTool: drawingsState.activeTool,
    setOverlay,
    drawings: drawingsList(drawingsState),
    selectedIds: drawingsState.selectedIds,
    stickyTool: drawingsState.stickyTool,
    setStickyTool: (sticky) => drawingsActions.setStickyTool(store, sticky),
    addDrawing: (drawing) => drawingsActions.addDrawing(store, drawing),
    updateDrawing: (id, patch) =>
      drawingsActions.updateDrawing(store, id, patch),
    removeDrawing: (id) => drawingsActions.removeDrawing(store, id),
    clearDrawings,
    serialize: () => drawingsActions.serialize(store),
    hydrate: (json) => drawingsActions.hydrate(store, json),
    toolbarProps: {
      tools: DRAWING_TOOL_METAS,
      activeTool: drawingsState.activeTool,
      setOverlay,
      clearDrawings,
    },
  };
};
