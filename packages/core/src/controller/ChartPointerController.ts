import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import {
  resolveChartPointer,
  type ChartPointerInfo,
} from "../interaction/resolveChartPointer";
import type { KeisenState, Store, Unsubscribe } from "../store/Store";
import type { ChartDataState } from "../types/kline";

const CLICK_MOVE_THRESHOLD_PX = 6;

export type ChartPointerHandlers = {
  onPointerMove?: (info: ChartPointerInfo | null) => void;
  onPointerDown?: (info: ChartPointerInfo) => void;
  onPointerUp?: (info: ChartPointerInfo) => void;
  onClick?: (info: ChartPointerInfo) => void;
};

type PendingDown = {
  pointerId: number;
  x: number;
  y: number;
  info: ChartPointerInfo;
  moved: boolean;
};

const moveKey = (info: ChartPointerInfo): string =>
  `${info.chartId}|${info.x}|${info.y}|${info.barIndex}|${info.value}|${info.timestamp}|${info.pointerType ?? ""}`;

/**
 * 订阅 EventBus，将 pointer 投影为 ChartPointerInfo 并回调业务 handlers。
 * leave 时对 onPointerMove 传 null。
 */
export class ChartPointerController {
  private unsubscribes: Unsubscribe[] = [];
  private handlers: ChartPointerHandlers;
  private pendingDown: PendingDown | null = null;
  private lastMoveKey: string | null = null;
  private lastEmittedNull = false;

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
    handlers: ChartPointerHandlers = {},
  ) {
    this.handlers = handlers;
    this.unsubscribes.push(
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerdown", this.onPointerDown),
      bus.on("pointerup", this.onPointerUp),
      bus.on("pointerleave", this.onPointerLeave),
    );
  }

  setHandlers(handlers: ChartPointerHandlers) {
    this.handlers = handlers;
  }

  private resolve(
    e: {
      viewId: string;
      x: number;
      y: number;
      pointerType?: string;
    },
  ): ChartPointerInfo | null {
    return resolveChartPointer(this.store.getState(), {
      viewId: e.viewId,
      x: e.x,
      y: e.y,
      pointerType: e.pointerType,
    });
  }

  private onPointerMove = (
    e: Extract<ChartEvent, { type: "pointermove" }>,
  ) => {
    if (this.pendingDown && e.pointerId === this.pendingDown.pointerId) {
      const dx = e.x - this.pendingDown.x;
      const dy = e.y - this.pendingDown.y;
      if (dx * dx + dy * dy > CLICK_MOVE_THRESHOLD_PX * CLICK_MOVE_THRESHOLD_PX) {
        this.pendingDown.moved = true;
      }
    }

    // hover：与十字线一致，拖拽中不发 move
    if (e.buttons !== 0) return;

    const info = this.resolve(e);
    if (!info) return;

    const key = moveKey(info);
    if (key === this.lastMoveKey) return;
    this.lastMoveKey = key;
    this.lastEmittedNull = false;
    this.handlers.onPointerMove?.(info);
  };

  private onPointerDown = (
    e: Extract<ChartEvent, { type: "pointerdown" }>,
  ) => {
    const info = this.resolve(e);
    if (!info) return;

    this.pendingDown = {
      pointerId: e.pointerId,
      x: e.x,
      y: e.y,
      info,
      moved: false,
    };
    this.handlers.onPointerDown?.(info);
  };

  private onPointerUp = (e: Extract<ChartEvent, { type: "pointerup" }>) => {
    const info = this.resolve(e);
    if (info) {
      this.handlers.onPointerUp?.(info);
    }

    const pending = this.pendingDown;
    this.pendingDown = null;
    if (!pending || pending.pointerId !== e.pointerId || pending.moved) return;

    const clickInfo = info ?? pending.info;
    if (
      Math.hypot(e.x - pending.x, e.y - pending.y) >
      CLICK_MOVE_THRESHOLD_PX
    ) {
      return;
    }
    this.handlers.onClick?.(clickInfo);
  };

  private onPointerLeave = (
    e: Extract<ChartEvent, { type: "pointerleave" }>,
  ) => {
    const state = this.store.getState();
    if (e.viewId !== "main" && !(e.viewId in state.ui.panes)) return;

    this.pendingDown = null;
    this.lastMoveKey = null;
    if (this.lastEmittedNull) return;
    this.lastEmittedNull = true;
    this.handlers.onPointerMove?.(null);
  };

  destroy() {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
    this.pendingDown = null;
  }
}
