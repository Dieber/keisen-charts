import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import {
  getDomainSpan,
  xToContinuousIndex,
  zoomIndexDomain,
} from "../math/viewport";
import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store, Unsubscribe } from "../store/Store";

/** 每次滚轮刻度对 span 的缩放因子（向上滚放大 = span 缩小） */
const ZOOM_FACTOR_IN = 0.975;
const ZOOM_FACTOR_OUT = 1.025;

export class ZoomController {
  private unsubscribes: Unsubscribe[] = [];
  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance: number | null = null;

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
    private viewId = "main",
  ) {
    this.unsubscribes.push(
      bus.on("wheel", this.onWheel),
      bus.on("pointerdown", this.onPointerDown),
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerup", this.onPointerUp),
    );
  }

  private onWheel = (e: Extract<ChartEvent, { type: "wheel" }>) => {
    if (e.viewId !== this.viewId) return;

    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? ZOOM_FACTOR_IN : ZOOM_FACTOR_OUT;
    this.applyZoom(factor, e.x);
  };

  private onPointerDown = (e: Extract<ChartEvent, { type: "pointerdown" }>) => {
    if (e.viewId !== this.viewId) return;

    this.pointers.set(e.pointerId, { x: e.x, y: e.y });
    if (this.pointers.size === 2) {
      this.lastPinchDistance = this.getPinchDistance();
    }
  };

  private onPointerMove = (e: Extract<ChartEvent, { type: "pointermove" }>) => {
    if (e.viewId !== this.viewId) return;
    if (!this.pointers.has(e.pointerId)) return;

    // 松开发生在 Pane 外时可能收不到 matching viewId 的 pointerup
    if (e.buttons === 0) {
      this.releasePointer(e.pointerId);
      return;
    }

    this.pointers.set(e.pointerId, { x: e.x, y: e.y });
    if (this.pointers.size !== 2 || this.lastPinchDistance === null) return;

    const distance = this.getPinchDistance();
    if (distance <= 0 || this.lastPinchDistance <= 0) return;

    // 捏合（距离变小）→ factor > 1 → 可见域变大；张开 → 可见域变小
    const factor = this.lastPinchDistance / distance;
    this.lastPinchDistance = distance;
    this.applyZoom(factor, this.getPinchMidpointX());
  };

  private onPointerUp = (e: Extract<ChartEvent, { type: "pointerup" }>) => {
    // 按 pointerId 结束，不要求 viewId：跨 Pane 松开时也能清掉指针状态
    if (!this.pointers.has(e.pointerId)) return;
    this.releasePointer(e.pointerId);
  };

  private releasePointer(pointerId: number) {
    this.pointers.delete(pointerId);
    if (this.pointers.size < 2) {
      this.lastPinchDistance = null;
    } else if (this.pointers.size === 2) {
      this.lastPinchDistance = this.getPinchDistance();
    }
  }

  private getPinchDistance(): number {
    const points = [...this.pointers.values()];
    if (points.length < 2) return 0;

    const dx = points[1]!.x - points[0]!.x;
    const dy = points[1]!.y - points[0]!.y;
    return Math.hypot(dx, dy);
  }

  private getPinchMidpointX(): number {
    const points = [...this.pointers.values()];
    return (points[0]!.x + points[1]!.x) / 2;
  }

  private applyZoom(factor: number, anchorX: number) {
    const { data, ui, config } = this.store.getState();
    const { indexDomain, viewportWidth } = ui;
    const span = getDomainSpan(indexDomain);
    if (span <= 0 || viewportWidth <= 0) return;

    const anchorContinuous = xToContinuousIndex(anchorX, indexDomain, viewportWidth);
    const nextDomain = zoomIndexDomain(indexDomain, anchorContinuous, factor, {
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
  }

  destroy() {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
    this.pointers.clear();
    this.lastPinchDistance = null;
  }
}
