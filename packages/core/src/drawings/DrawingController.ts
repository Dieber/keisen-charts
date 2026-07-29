import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import { getPane, type KeisenState, type Store, type Unsubscribe } from "../store/Store";
import type { ChartDataState } from "../types/kline";
import {
  anchorDrawingPoint,
  resolveDrawingForProject,
} from "./anchor";
import { distPointToPoint } from "./geometry";
import { buildDrawingHelpers } from "./projectHelpers";
import { getDrawingTool } from "./tools";
import {
  DEFAULT_DRAWING_STYLE,
  DRAWING_HANDLE_HIT_RADIUS,
  isDrawingEditable,
  type Drawing,
  type DrawingCursor,
  type DrawingGesture,
  type DrawingPoint,
  type DrawingToolId,
  type DrawingsState,
} from "./types";

const createId = (): string =>
  `drawing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isDrawingSource = (
  viewId: string,
  state: KeisenState<ChartDataState>,
): boolean => viewId === "main" || viewId in state.ui.panes;

const patchDrawings = (
  store: Store<KeisenState<ChartDataState>>,
  updater: (prev: DrawingsState) => DrawingsState,
): void => {
  store.setState((s) => ({
    ...s,
    ui: {
      ...s.ui,
      drawings: updater(s.ui.drawings),
    },
  }));
};

const resolvePaneGeometry = (
  viewId: string,
  state: KeisenState<ChartDataState>,
) => {
  const { ui } = state;
  if (viewId === "main") {
    return {
      paneId: "main",
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    };
  }
  const pane = getPane(ui, viewId);
  return {
    paneId: viewId,
    indexDomain: ui.indexDomain,
    valueDomain: pane.domain,
    viewportWidth: ui.viewportWidth,
    viewportHeight: pane.viewportHeight,
  };
};

export class DrawingController {
  private unsubscribes: Unsubscribe[] = [];
  private lastHover: { x: number; y: number; paneId: string } | null = null;

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
  ) {
    this.unsubscribes.push(
      bus.on("pointerdown", this.onPointerDown),
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerup", this.onPointerUp),
      bus.on("pointerleave", this.onPointerLeave),
    );

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.onKeyDown);
    }
  }

  private setCursor(cursor: DrawingCursor | null): void {
    if (this.store.getState().ui.drawings.cursor === cursor) return;
    patchDrawings(this.store, (d) => ({ ...d, cursor }));
  }

  /** 浏览模式下：命中任意可见图形 → pointer */
  private hitAnyDrawing(
    x: number,
    y: number,
    paneId: string,
    state: KeisenState<ChartDataState>,
  ): boolean {
    const geo = resolvePaneGeometry(paneId, state);
    const helpers = buildDrawingHelpers(geo);
    const kline = state.data.kline;

    for (const id of state.ui.drawings.selectedIds) {
      const drawing = state.ui.drawings.items[id];
      if (!drawing || drawing.paneId !== paneId || !isDrawingEditable(drawing)) {
        continue;
      }
      const projected = resolveDrawingForProject(drawing, kline);
      if (this.hitTestHandle(x, y, projected, helpers) != null) return true;
    }

    for (const drawing of Object.values(state.ui.drawings.items)) {
      if (drawing.paneId !== paneId || drawing.visible === false) continue;
      const projected = resolveDrawingForProject(drawing, kline);
      const hit = getDrawingTool(drawing.tool).hitTest(
        x,
        y,
        projected,
        helpers,
      );
      if (hit) return true;
    }
    return false;
  }

  private refreshHoverCursor(
    x: number,
    y: number,
    paneId: string,
    state: KeisenState<ChartDataState>,
  ): void {
    if (state.ui.drawings.activeTool || state.ui.drawings.gesture) {
      return;
    }
    this.setCursor(this.hitAnyDrawing(x, y, paneId, state) ? "pointer" : null);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (event.key === "Escape") {
      patchDrawings(this.store, (d) => ({
        ...d,
        activeTool: null,
        draft: null,
        selectedIds: [],
        gesture: null,
        cursor: null,
      }));
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      const { selectedIds } = this.store.getState().ui.drawings;
      if (selectedIds.length === 0) return;
      event.preventDefault();
      patchDrawings(this.store, (d) => {
        const items = { ...d.items };
        for (const id of d.selectedIds) delete items[id];
        return { ...d, items, selectedIds: [], gesture: null, cursor: null };
      });
    }
  };

  private pointerToPoint(
    e: Extract<ChartEvent, { type: "pointerdown" | "pointermove" }>,
  ): { paneId: string; point: DrawingPoint } | null {
    const state = this.store.getState();
    if (!isDrawingSource(e.viewId, state)) return null;
    const geo = resolvePaneGeometry(e.viewId, state);
    const helpers = buildDrawingHelpers(geo);
    const raw = {
      barIndex: helpers.barOfX(e.x),
      value: helpers.valueOfY(e.y),
    };
    return {
      paneId: geo.paneId,
      point: anchorDrawingPoint(raw, state.data.kline),
    };
  }

  private onPointerDown = (
    e: Extract<ChartEvent, { type: "pointerdown" }>,
  ): void => {
    const state = this.store.getState();
    const { drawings } = state.ui;
    const mapped = this.pointerToPoint(e);
    if (!mapped) return;

    if (drawings.activeTool) {
      this.handlePlace(drawings.activeTool, mapped.paneId, mapped.point);
      return;
    }

    this.handleSelectOrDrag(e.x, e.y, mapped.paneId, state);
  };

  private onPointerMove = (
    e: Extract<ChartEvent, { type: "pointermove" }>,
  ): void => {
    const state = this.store.getState();
    const { drawings } = state.ui;
    const mapped = this.pointerToPoint(e);
    if (mapped) {
      this.lastHover = { x: e.x, y: e.y, paneId: mapped.paneId };
    }

    if (drawings.gesture) {
      if (e.buttons === 0) {
        this.endGesture();
        return;
      }
      this.setCursor("grabbing");
      this.applyGesture(e.x, e.y, drawings.gesture, state);
      return;
    }

    if (drawings.activeTool) {
      this.setCursor(null);
      if (!drawings.draft || !mapped || mapped.paneId !== drawings.draft.paneId) {
        return;
      }

      const prev = drawings.draft.preview;
      if (
        prev &&
        prev.barIndex === mapped.point.barIndex &&
        prev.value === mapped.point.value
      ) {
        return;
      }

      patchDrawings(this.store, (d) => {
        if (!d.draft || d.draft.paneId !== mapped.paneId) return d;
        return {
          ...d,
          draft: { ...d.draft, preview: mapped.point },
        };
      });
      return;
    }

    if (mapped) {
      this.refreshHoverCursor(e.x, e.y, mapped.paneId, state);
    }
  };

  private onPointerUp = (
    e: Extract<ChartEvent, { type: "pointerup" }>,
  ): void => {
    void e;
    if (this.store.getState().ui.drawings.gesture) {
      this.endGesture();
    }
  };

  private onPointerLeave = (
    e: Extract<ChartEvent, { type: "pointerleave" }>,
  ): void => {
    void e;
    this.lastHover = null;
    if (!this.store.getState().ui.drawings.gesture) {
      this.setCursor(null);
    }
  };

  private endGesture(): void {
    patchDrawings(this.store, (d) =>
      d.gesture ? { ...d, gesture: null } : d,
    );
    const state = this.store.getState();
    if (this.lastHover && !state.ui.drawings.activeTool) {
      this.refreshHoverCursor(
        this.lastHover.x,
        this.lastHover.y,
        this.lastHover.paneId,
        state,
      );
    } else {
      this.setCursor(null);
    }
  }

  private handlePlace(
    toolId: DrawingToolId,
    paneId: string,
    point: DrawingPoint,
  ): void {
    const tool = getDrawingTool(toolId);
    const { drawings } = this.store.getState().ui;
    const draft =
      drawings.draft &&
      drawings.draft.tool === toolId &&
      drawings.draft.paneId === paneId
        ? drawings.draft
        : { tool: toolId, paneId, points: [] as DrawingPoint[] };

    const nextPoints = [...draft.points, point];

    if (nextPoints.length < tool.pointsRequired) {
      patchDrawings(this.store, (d) => ({
        ...d,
        draft: {
          tool: toolId,
          paneId,
          points: nextPoints,
          preview: null,
        },
        selectedIds: [],
        gesture: null,
      }));
      return;
    }

    const drawing: Drawing = {
      id: createId(),
      tool: toolId,
      paneId,
      points: nextPoints.slice(0, tool.pointsRequired),
      style: { ...DEFAULT_DRAWING_STYLE },
      editable: true,
    };

    patchDrawings(this.store, (d) => ({
      ...d,
      items: { ...d.items, [drawing.id]: drawing },
      draft: null,
      activeTool: d.stickyTool ? d.activeTool : null,
      selectedIds: [drawing.id],
      gesture: null,
    }));
  }

  private hitTestHandle(
    x: number,
    y: number,
    drawing: Drawing,
    helpers: ReturnType<typeof buildDrawingHelpers>,
  ): number | null {
    let bestIndex: number | null = null;
    let bestDist = DRAWING_HANDLE_HIT_RADIUS;
    for (let i = 0; i < drawing.points.length; i++) {
      const p = drawing.points[i]!;
      const dist = distPointToPoint(
        { x, y },
        { x: helpers.xOfBar(p.barIndex), y: helpers.yOfValue(p.value) },
      );
      if (dist <= bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  private handleSelectOrDrag(
    x: number,
    y: number,
    paneId: string,
    state: KeisenState<ChartDataState>,
  ): void {
    const geo = resolvePaneGeometry(paneId, state);
    const helpers = buildDrawingHelpers(geo);
    const { drawings } = state.ui;
    const kline = state.data.kline;

    // 1) 已选中且可编辑：优先命中手柄
    for (const id of drawings.selectedIds) {
      const drawing = drawings.items[id];
      if (!drawing || drawing.paneId !== paneId || !isDrawingEditable(drawing)) {
        continue;
      }
      const projected = resolveDrawingForProject(drawing, kline);
      const handleIndex = this.hitTestHandle(x, y, projected, helpers);
      if (handleIndex != null) {
        const gesture: DrawingGesture = {
          kind: "resize",
          drawingId: id,
          pointIndex: handleIndex,
          startPointer: { x, y },
          startPoints: projected.points.map((p) => ({ ...p })),
        };
        patchDrawings(this.store, (d) => ({
          ...d,
          selectedIds: [id],
          gesture,
          cursor: "grabbing",
        }));
        return;
      }
    }

    // 2) 命中图形本体
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const drawing of Object.values(drawings.items)) {
      if (drawing.paneId !== paneId || drawing.visible === false) continue;
      const projected = resolveDrawingForProject(drawing, kline);
      const hit = getDrawingTool(drawing.tool).hitTest(
        x,
        y,
        projected,
        helpers,
      );
      if (hit && hit.dist < bestDist) {
        bestDist = hit.dist;
        bestId = drawing.id;
      }
    }

    if (!bestId) {
      patchDrawings(this.store, (d) => ({
        ...d,
        selectedIds: [],
        gesture: null,
        cursor: null,
      }));
      return;
    }

    const hitDrawing = drawings.items[bestId]!;
    const projected = resolveDrawingForProject(hitDrawing, kline);

    if (!isDrawingEditable(hitDrawing)) {
      patchDrawings(this.store, (d) => ({
        ...d,
        selectedIds: [bestId!],
        gesture: null,
        cursor: "pointer",
      }));
      return;
    }

    const gesture: DrawingGesture = {
      kind: "move",
      drawingId: bestId,
      startPointer: { x, y },
      startPoints: projected.points.map((p) => ({ ...p })),
    };
    patchDrawings(this.store, (d) => ({
      ...d,
      selectedIds: [bestId!],
      gesture,
      cursor: "grabbing",
    }));
  }

  private applyGesture(
    x: number,
    y: number,
    gesture: DrawingGesture,
    state: KeisenState<ChartDataState>,
  ): void {
    const drawing = state.ui.drawings.items[gesture.drawingId];
    if (!drawing || !isDrawingEditable(drawing)) {
      this.endGesture();
      return;
    }

    const geo = resolvePaneGeometry(drawing.paneId, state);
    const helpers = buildDrawingHelpers(geo);
    const dx = x - gesture.startPointer.x;
    const dy = y - gesture.startPointer.y;
    const kline = state.data.kline;

    let nextPoints: DrawingPoint[];
    if (gesture.kind === "resize" && gesture.pointIndex != null) {
      nextPoints = gesture.startPoints.map((p, i) => {
        if (i !== gesture.pointIndex) return { ...p };
        const sx = helpers.xOfBar(p.barIndex) + dx;
        const sy = helpers.yOfValue(p.value) + dy;
        return anchorDrawingPoint(
          {
            barIndex: helpers.barOfX(sx),
            value: helpers.valueOfY(sy),
          },
          kline,
        );
      });
    } else {
      nextPoints = gesture.startPoints.map((p) => {
        const sx = helpers.xOfBar(p.barIndex) + dx;
        const sy = helpers.yOfValue(p.value) + dy;
        return anchorDrawingPoint(
          {
            barIndex: helpers.barOfX(sx),
            value: helpers.valueOfY(sy),
          },
          kline,
        );
      });
    }

    patchDrawings(this.store, (d) => {
      const prev = d.items[gesture.drawingId];
      if (!prev) return d;
      return {
        ...d,
        items: {
          ...d.items,
          [gesture.drawingId]: { ...prev, points: nextPoints },
        },
      };
    });
  }

  destroy(): void {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.onKeyDown);
    }
  }
}

/** 程序化 API helpers（供 toolkit / 测试） */
export const drawingsActions = {
  setActiveTool(
    store: Store<KeisenState<ChartDataState>>,
    tool: DrawingToolId | null,
  ): void {
    patchDrawings(store, (d) => ({
      ...d,
      activeTool: tool,
      draft: null,
      selectedIds: tool ? [] : d.selectedIds,
      gesture: null,
      cursor: null,
    }));
  },

  setStickyTool(
    store: Store<KeisenState<ChartDataState>>,
    stickyTool: boolean,
  ): void {
    patchDrawings(store, (d) => ({ ...d, stickyTool }));
  },

  addDrawing(
    store: Store<KeisenState<ChartDataState>>,
    drawing: Omit<Drawing, "id" | "points"> & {
      id?: string;
      points: Array<Omit<DrawingPoint, "time"> & { time?: number }>;
    },
  ): string {
    const id = drawing.id ?? createId();
    const kline = store.getState().data.kline;
    const next: Drawing = {
      ...drawing,
      id,
      points: drawing.points.map((p) => anchorDrawingPoint(p, kline)),
      style: { ...DEFAULT_DRAWING_STYLE, ...drawing.style },
      editable: drawing.editable ?? true,
    };
    patchDrawings(store, (d) => ({
      ...d,
      items: { ...d.items, [id]: next },
    }));
    return id;
  },

  updateDrawing(
    store: Store<KeisenState<ChartDataState>>,
    id: string,
    patch: Partial<Drawing>,
  ): void {
    patchDrawings(store, (d) => {
      const prev = d.items[id];
      if (!prev) return d;
      return {
        ...d,
        items: {
          ...d.items,
          [id]: {
            ...prev,
            ...patch,
            style: patch.style
              ? { ...prev.style, ...patch.style }
              : prev.style,
          },
        },
      };
    });
  },

  removeDrawing(
    store: Store<KeisenState<ChartDataState>>,
    id: string,
  ): void {
    patchDrawings(store, (d) => {
      if (!d.items[id]) return d;
      const items = { ...d.items };
      delete items[id];
      return {
        ...d,
        items,
        selectedIds: d.selectedIds.filter((sid) => sid !== id),
        gesture: d.gesture?.drawingId === id ? null : d.gesture,
      };
    });
  },

  clearDrawings(
    store: Store<KeisenState<ChartDataState>>,
    paneId?: string,
  ): void {
    patchDrawings(store, (d) => {
      if (!paneId) {
        return {
          ...d,
          items: {},
          draft: null,
          selectedIds: [],
          gesture: null,
          cursor: null,
        };
      }
      const items: Record<string, Drawing> = {};
      for (const [id, drawing] of Object.entries(d.items)) {
        if (drawing.paneId !== paneId) items[id] = drawing;
      }
      return {
        ...d,
        items,
        draft:
          d.draft?.paneId === paneId ? null : d.draft,
        selectedIds: d.selectedIds.filter((id) => items[id]),
        gesture:
          d.gesture && items[d.gesture.drawingId] ? d.gesture : null,
      };
    });
  },

  serialize(store: Store<KeisenState<ChartDataState>>): string {
    return JSON.stringify(store.getState().ui.drawings.items);
  },

  hydrate(
    store: Store<KeisenState<ChartDataState>>,
    json: string,
  ): void {
    const items = JSON.parse(json) as Record<string, Drawing>;
    patchDrawings(store, (d) => ({
      ...d,
      items,
      draft: null,
      selectedIds: [],
      gesture: null,
      cursor: null,
    }));
  },
};
