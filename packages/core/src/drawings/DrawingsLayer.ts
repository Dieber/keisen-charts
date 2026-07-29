import type { ILayer } from "../renderer/base/ILayer";
import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store } from "../store/Store";
import {
  resolveDrawingForProject,
  resolveDrawingPoints,
} from "./anchor";
import { buildDrawingHelpers } from "./projectHelpers";
import { getDrawingTool } from "./tools";
import {
  DEFAULT_DRAWING_STYLE,
  DRAWING_HANDLE_DIAMETER,
  isDrawingEditable,
  type Drawing,
  type DrawingProjectHelpers,
} from "./types";

type DrawingsViewportData = {
  viewport: {
    indexDomain: { start: number; end: number };
    viewportWidth: number;
    viewportHeight: number;
    priceDomain?: { min: number; max: number };
    paneDomain?: { min: number; max: number };
  };
  formatPrice?: (value: number) => string;
};

const resolveValueDomain = (
  viewport: DrawingsViewportData["viewport"],
): { min: number; max: number } =>
  viewport.priceDomain ?? viewport.paneDomain ?? { min: 0, max: 1 };

export class DrawingsLayer
  implements ILayer<CanvasRenderingContext2D, DrawingsViewportData>
{
  readonly zIndex = 8;
  readonly id: string;
  private readonly paneId: string;
  private readonly store: Store<KeisenState<ChartDataState>>;

  constructor(
    paneId: string,
    store: Store<KeisenState<ChartDataState>>,
  ) {
    this.paneId = paneId;
    this.store = store;
    this.id = `DrawingsLayer-${paneId}`;
  }

  private helpersFromData(data: DrawingsViewportData): DrawingProjectHelpers {
    const { viewport } = data;
    return buildDrawingHelpers({
      indexDomain: viewport.indexDomain,
      valueDomain: resolveValueDomain(viewport),
      viewportWidth: viewport.viewportWidth,
      viewportHeight: viewport.viewportHeight,
      formatValue: data.formatPrice,
    });
  }

  draw(ctx: CanvasRenderingContext2D, data: DrawingsViewportData): void {
    const state = this.store.getState();
    const { drawings } = state.ui;
    const { kline } = state.data;
    const helpers = this.helpersFromData(data);

    // draft 预览会 setLineDash；必须隔离，避免污染后续帧的指标线等
    ctx.save();
    try {
      for (const drawing of Object.values(drawings.items)) {
        if (drawing.paneId !== this.paneId) continue;
        if (drawing.visible === false) continue;
        const projected = resolveDrawingForProject(drawing, kline);
        const tool = getDrawingTool(drawing.tool);
        tool.paint(ctx, projected, helpers);
        if (
          drawings.selectedIds.includes(drawing.id) &&
          isDrawingEditable(drawing)
        ) {
          this.paintSelectionHandles(ctx, projected, helpers);
        }
      }

      const { draft } = drawings;
      if (draft && draft.paneId === this.paneId) {
        const tool = getDrawingTool(draft.tool);
        const committed = resolveDrawingPoints(draft.points, kline);
        const draftPoints =
          draft.preview != null
            ? [...committed, ...resolveDrawingPoints([draft.preview], kline)]
            : committed;
        tool.paintDraft(
          ctx,
          draftPoints,
          helpers,
          DEFAULT_DRAWING_STYLE,
        );
      }
    } finally {
      ctx.restore();
    }
  }

  private paintSelectionHandles(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    helpers: DrawingProjectHelpers,
  ): void {
    const r = DRAWING_HANDLE_DIAMETER / 2;
    ctx.fillStyle = drawing.style.stroke;
    ctx.strokeStyle = drawing.style.stroke;
    ctx.lineWidth = 1;
    for (const point of drawing.points) {
      const x = helpers.xOfBar(point.barIndex);
      const y = helpers.yOfValue(point.value);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
