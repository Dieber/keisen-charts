import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import { getPriceRange, panPriceDomain } from "../math/priceViewport";
import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store, Unsubscribe } from "../store/Store";

/**
 * 自由画布模式下，在主图区域垂直拖拽平移 priceDomain。
 * 仅在 yAxisMode === 'manual' 时生效。
 */
export class YScrollController {
  private activePointers = new Set<number>();
  private dragging = false;
  private dragPointerId: number | null = null;
  private lastY = 0;
  private unsubscribes: Unsubscribe[] = [];

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
    private viewId = "main",
  ) {
    this.unsubscribes.push(
      bus.on("pointerdown", this.onPointerDown),
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerup", this.onPointerUp),
    );
  }

  private onPointerDown = (e: Extract<ChartEvent, { type: "pointerdown" }>) => {
    if (e.viewId !== this.viewId) return;
    const state = this.store.getState();
    if (state.ui.yAxisMode !== "manual") return;
    // 画线放置 / 编辑手势：不抢占 Y 平移
    if (state.ui.drawings.activeTool || state.ui.drawings.gesture) return;

    this.activePointers.add(e.pointerId);
    if (this.activePointers.size === 1) {
      this.dragging = true;
      this.dragPointerId = e.pointerId;
      this.lastY = e.y;
    } else {
      this.dragging = false;
      this.dragPointerId = null;
    }
  };

  private onPointerMove = (e: Extract<ChartEvent, { type: "pointermove" }>) => {
    if (
      !this.dragging ||
      e.viewId !== this.viewId ||
      this.activePointers.size !== 1 ||
      e.pointerId !== this.dragPointerId
    ) {
      return;
    }

    // 松开发生在 Pane 外时可能收不到 matching viewId 的 pointerup
    if (e.buttons === 0) {
      this.endDrag(e.pointerId);
      return;
    }

    const { ui } = this.store.getState();
    if (ui.yAxisMode !== "manual") return;

    const dy = e.y - this.lastY;
    this.lastY = e.y;

    const range = getPriceRange(ui.priceDomain);
    const viewportHeight = ui.viewportHeight;
    if (viewportHeight <= 0 || range <= 0) return;

    const priceDelta = (dy / viewportHeight) * range;
    const nextDomain = panPriceDomain(ui.priceDomain, priceDelta);

    this.store.setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        priceDomain: nextDomain,
      },
    }));
  };

  private onPointerUp = (e: Extract<ChartEvent, { type: "pointerup" }>) => {
    // 按 pointerId 结束，不要求 viewId：跨 Pane 松开时也能清掉拖动状态
    if (
      !this.activePointers.has(e.pointerId) &&
      e.pointerId !== this.dragPointerId
    ) {
      return;
    }
    this.endDrag(e.pointerId);
  };

  private endDrag(pointerId: number) {
    this.activePointers.delete(pointerId);
    if (pointerId === this.dragPointerId) {
      this.dragging = false;
      this.dragPointerId = null;
    }
  }

  destroy() {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
    this.activePointers.clear();
    this.dragging = false;
    this.dragPointerId = null;
  }
}
