import type { EventBus } from "../event/EventBus";
import type { ChartEvent } from "../event/types";
import { snapBarIndex } from "../math/crosshair";
import type { ChartDataState } from "../types/kline";
import type {
  CrosshairSourceViewId,
  CrosshairState,
  KeisenState,
  Store,
  Unsubscribe,
} from "../store/Store";

const isCrosshairSource = (
  viewId: string,
  state: KeisenState<ChartDataState>,
): boolean => viewId === "main" || viewId in state.ui.panes;

export class CrosshairController {
  private unsubscribes: Unsubscribe[] = [];

  constructor(
    private store: Store<KeisenState<ChartDataState>>,
    private bus: EventBus,
  ) {
    this.unsubscribes.push(
      bus.on("pointermove", this.onPointerMove),
      bus.on("pointerleave", this.onPointerLeave),
    );
  }

  private onPointerMove = (
    e: Extract<ChartEvent, { type: "pointermove" }>,
  ) => {
    const state = this.store.getState();
    if (!isCrosshairSource(e.viewId, state) || e.buttons !== 0) return;

    const { data, ui } = state;
    if (data.kline.length === 0) return;

    const barIndex = snapBarIndex(
      e.x,
      ui.indexDomain,
      ui.viewportWidth,
      data.kline.length,
    );

    const next: NonNullable<CrosshairState> = {
      barIndex,
      sourceViewId: e.viewId as CrosshairSourceViewId,
      localY: e.y,
    };

    const prev = ui.crosshair;
    if (
      prev &&
      prev.barIndex === next.barIndex &&
      prev.sourceViewId === next.sourceViewId &&
      prev.localY === next.localY
    ) {
      return;
    }

    this.store.setState((s) => ({
      ...s,
      ui: {
        ...s.ui,
        crosshair: next,
      },
    }));
  };

  private onPointerLeave = (
    e: Extract<ChartEvent, { type: "pointerleave" }>,
  ) => {
    const state = this.store.getState();
    if (!isCrosshairSource(e.viewId, state)) return;
    if (state.ui.crosshair === null) return;

    this.store.setState((s) => ({
      ...s,
      ui: {
        ...s.ui,
        crosshair: null,
      },
    }));
  };

  destroy() {
    for (const unsub of this.unsubscribes) unsub();
    this.unsubscribes = [];
  }
}
