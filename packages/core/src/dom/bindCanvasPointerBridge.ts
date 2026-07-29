import type { EventBus } from "../event/EventBus";

export type CanvasPointerBridgeMode = "chart" | "y-axis";

export type BindCanvasPointerBridgeOptions = {
  viewId: string;
  bus: EventBus;
  /**
   * `chart`：pointer + leave + wheel（主图 / 副图）
   * `y-axis`：仅 pointerdown/move/up/cancel（Y 轴缩放）
   */
  mode?: CanvasPointerBridgeMode;
};

const toLocal = (e: PointerEvent) => ({
  x: e.offsetX,
  y: e.offsetY,
  pointerId: e.pointerId,
  buttons: e.buttons,
  pointerType: e.pointerType || undefined,
});

/**
 * 将 canvas 的 Pointer / Wheel 事件桥接到 EventBus；返回 unbind。
 */
export const bindCanvasPointerBridge = (
  canvas: HTMLCanvasElement,
  options: BindCanvasPointerBridgeOptions,
): (() => void) => {
  const { viewId, bus, mode = "chart" } = options;

  const onPointerDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    bus.dispatch({ type: "pointerdown", viewId, ...toLocal(e) });
  };

  const onPointerMove = (e: PointerEvent) => {
    bus.dispatch({ type: "pointermove", viewId, ...toLocal(e) });
  };

  const onPointerUp = (e: PointerEvent) => {
    bus.dispatch({ type: "pointerup", viewId, ...toLocal(e) });
  };

  const onPointerCancel = (e: PointerEvent) => {
    bus.dispatch({ type: "pointerup", viewId, ...toLocal(e) });
  };

  const onLostPointerCapture = (e: PointerEvent) => {
    bus.dispatch({ type: "pointerup", viewId, ...toLocal(e) });
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("lostpointercapture", onLostPointerCapture);

  if (mode === "y-axis") {
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
    };
  }

  const onPointerLeave = () => {
    bus.dispatch({ type: "pointerleave", viewId });
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    bus.dispatch({
      type: "wheel",
      viewId,
      x: e.offsetX,
      y: e.offsetY,
      deltaY: e.deltaY,
    });
  };

  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerCancel);
    canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("wheel", onWheel);
  };
};
