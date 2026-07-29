import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import { zoomPriceDomain } from "../math/priceViewport";
import type { ChartDataState } from "../types/kline";
import {
  getPane,
  type KeisenState,
  type PaneViewportState,
  type PriceDomain,
  type Store,
  type UiState,
  type Unsubscribe,
} from "../store/Store";

/** 拖动距离相对视口高度的缩放灵敏度（越大越灵敏） */
const DRAG_ZOOM_SENSITIVITY = 2.5;

export type YZoomControllerConfig = {
  viewId: string;
  getDomain: (ui: UiState) => PriceDomain;
  getViewportHeight: (ui: UiState) => number;
  /** 写入 nextDomain 与对应 mode 字段；panes 可为部分字段（会与现有 pane 合并） */
  applyDomain: (nextDomain: PriceDomain) => Omit<Partial<UiState>, "panes"> & {
    panes?: Record<string, Partial<PaneViewportState>>;
  };
};

export const klineYZoomConfig: YZoomControllerConfig = {
  viewId: "kline-y-axis",
  getDomain: (ui) => ui.priceDomain,
  getViewportHeight: (ui) => ui.viewportHeight,
  applyDomain: (nextDomain) => ({
    yAxisMode: "manual",
    priceDomain: nextDomain,
  }),
};

export const createPaneYZoomConfig = (
  paneId: string,
): YZoomControllerConfig => ({
  viewId: `${paneId}-y-axis`,
  getDomain: (ui) => getPane(ui, paneId).domain,
  getViewportHeight: (ui) => getPane(ui, paneId).viewportHeight,
  applyDomain: (nextDomain) => ({
    panes: {
      [paneId]: {
        domain: nextDomain,
        yAxisMode: "manual",
      },
    },
  }),
});

/**
 * Y 轴拖动缩放：上下拖动改变可见价域。
 * 向下拖 → 可见域变大；向上拖 → 可见域变小；锚点为域中点。
 */
export class YZoomController {
  private unsubscribes: Unsubscribe[] = [];
  private config: YZoomControllerConfig;
  private dragging = false;
  private dragPointerId: number | null = null;
  private lastY = 0;

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
    config: YZoomControllerConfig | string = klineYZoomConfig,
  ) {
    // 兼容旧调用：`new YZoomController(store, bus, "kline-y-axis")`
    this.config =
      typeof config === "string"
        ? { ...klineYZoomConfig, viewId: config }
        : config;
    this.unsubscribes.push(
      bus.on("pointerdown", this.onPointerDown),
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerup", this.onPointerUp),
    );
  }

  private onPointerDown = (e: Extract<ChartEvent, { type: "pointerdown" }>) => {
    if (e.viewId !== this.config.viewId) return;

    this.dragging = true;
    this.dragPointerId = e.pointerId;
    this.lastY = e.y;
  };

  private onPointerMove = (e: Extract<ChartEvent, { type: "pointermove" }>) => {
    if (
      !this.dragging ||
      e.viewId !== this.config.viewId ||
      e.pointerId !== this.dragPointerId
    ) {
      return;
    }

    // 松开发生在 Pane 外时可能收不到 matching viewId 的 pointerup
    if (e.buttons === 0) {
      this.endDrag(e.pointerId);
      return;
    }

    const dy = e.y - this.lastY;
    this.lastY = e.y;
    if (dy === 0) return;

    const { ui } = this.store.getState();
    const domain = this.config.getDomain(ui);
    const viewportHeight = this.config.getViewportHeight(ui);
    if (viewportHeight <= 0) return;

    // dy > 0（向下）→ factor > 1 → 可见域变大
    const factor = Math.exp((dy / viewportHeight) * DRAG_ZOOM_SENSITIVITY);
    const anchorValue = (domain.min + domain.max) / 2;
    const nextDomain = zoomPriceDomain(domain, anchorValue, factor);

    this.store.setState((prev) => {
      const patch = this.config.applyDomain(nextDomain);
      const nextPanes =
        patch.panes != null
          ? {
              ...prev.ui.panes,
              ...Object.fromEntries(
                Object.entries(patch.panes).map(([id, panePatch]) => [
                  id,
                  {
                    ...(prev.ui.panes[id] ?? {
                      domain: nextDomain,
                      viewportHeight: this.config.getViewportHeight(prev.ui),
                      yAxisMode: "auto" as const,
                    }),
                    ...panePatch,
                  },
                ]),
              ),
            }
          : prev.ui.panes;

      const { panes: _ignored, ...restPatch } = patch;
      return {
        ...prev,
        ui: {
          ...prev.ui,
          ...restPatch,
          panes: nextPanes,
        },
      };
    });
  };

  private onPointerUp = (e: Extract<ChartEvent, { type: "pointerup" }>) => {
    // 按 pointerId 结束，不要求 viewId：跨 Pane 松开时也能清掉拖动状态
    if (e.pointerId !== this.dragPointerId) return;
    this.endDrag(e.pointerId);
  };

  private endDrag(pointerId: number) {
    if (pointerId !== this.dragPointerId) return;
    this.dragging = false;
    this.dragPointerId = null;
  }

  destroy() {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
    this.dragging = false;
    this.dragPointerId = null;
  }
}
