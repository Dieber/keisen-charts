import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import {
  getDomainSpan,
  panIndexDomain,
} from "../math/viewport";
import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store, Unsubscribe } from "../store/Store";

export class ScrollController {
  private activePointers = new Set<number>();
  private dragging = false;
  private dragPointerId: number | null = null;
  private lastX = 0;
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
    const { drawings } = this.store.getState().ui;
    // 画线放置 / 编辑手势：不抢占拖拽平移
    if (drawings.activeTool || drawings.gesture) return;

    this.activePointers.add(e.pointerId);
    if (this.activePointers.size === 1) {
      this.dragging = true;
      this.dragPointerId = e.pointerId;
      this.lastX = e.x;
      return;
    }

    this.dragging = false;
    this.dragPointerId = null;
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

    const dx = e.x - this.lastX;
    this.lastX = e.x;

    const { data, ui, config } = this.store.getState();
    const span = getDomainSpan(ui.indexDomain);
    const viewportWidth = ui.viewportWidth;
    const indexDelta = viewportWidth > 0 ? -(dx / viewportWidth) * span : 0;

    const nextDomain = panIndexDomain(ui.indexDomain, indexDelta, {
      klineLength: data.kline.length,
      viewportWidth,
      rightOffset: config.rightOffset,
    });

    this.store.setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        indexDomain: nextDomain,
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
