import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store } from "../store/Store";
import {
  bindCanvasPointerBridge,
  type BindCanvasPointerBridgeOptions,
} from "./bindCanvasPointerBridge";
import { observeElementResize } from "./observeElementResize";
import {
  syncCanvasViewSize,
  type ResizableCanvasView,
} from "./syncCanvasViewSize";

export type AttachCanvasViewHostOptions = {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  view: ResizableCanvasView;
  /** 省略则只做 resize（如 X 轴） */
  pointer?: BindCanvasPointerBridgeOptions;
  /**
   * 提供 store 时，将 `ui.drawings.cursor` 同步到 canvas
   *（悬停手型 / 拖动抓握；否则 crosshair）。
   */
  store?: Store<KeisenState<ChartDataState>>;
};

const DEFAULT_CHART_CURSOR = "crosshair";

/**
 * 挂载 canvas view 的共享 host：首次同步尺寸、ResizeObserver、可选 pointer 桥接。
 * 返回 teardown（不负责 view.destroy / controller.destroy）。
 */
export const attachCanvasViewHost = (
  options: AttachCanvasViewHostOptions,
): (() => void) => {
  const { container, canvas, view, pointer, store } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return () => {};
  }

  const sync = () => {
    syncCanvasViewSize(ctx, container, view);
  };

  sync();
  const unobserve = observeElementResize(container, sync);
  const unbindPointer = pointer
    ? bindCanvasPointerBridge(canvas, pointer)
    : undefined;

  let unsubCursor: (() => void) | undefined;
  if (store) {
    const applyCursor = () => {
      const next = store.getState().ui.drawings.cursor ?? DEFAULT_CHART_CURSOR;
      if (canvas.style.cursor !== next) {
        canvas.style.cursor = next;
      }
    };
    applyCursor();
    unsubCursor = store.subscribeSlice(
      (s) => s.ui.drawings.cursor,
      applyCursor,
    );
  }

  return () => {
    unobserve();
    unbindPointer?.();
    unsubCursor?.();
  };
};
