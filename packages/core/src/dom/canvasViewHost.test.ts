import { describe, expect, mock, test } from "bun:test";

import { createEventBus } from "../event/EventBus";
import { bindCanvasPointerBridge } from "./bindCanvasPointerBridge";
import { measureElementSize } from "./measureElementSize";
import { syncCanvasViewSize } from "./syncCanvasViewSize";

const createFakeCanvas = () => {
  const listeners = new Map<string, Set<EventListener>>();
  const canvas = {
    width: 0,
    height: 0,
    setPointerCapture: mock(() => {}),
    addEventListener(type: string, handler: EventListener) {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    removeEventListener(type: string, handler: EventListener) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type: string, event: Record<string, unknown>) {
      const set = listeners.get(type);
      if (!set) return;
      for (const handler of set) {
        handler(event as unknown as Event);
      }
    },
  };
  return canvas;
};

describe("measureElementSize", () => {
  test("prefers clientWidth/Height and clamps to >= 1", () => {
    const element = {
      clientWidth: 120.4,
      clientHeight: 80.6,
      getBoundingClientRect: () => ({ width: 1, height: 1 }),
    } as HTMLElement;
    expect(measureElementSize(element)).toEqual({ width: 120, height: 81 });
  });

  test("falls back to bounding rect when client size is 0", () => {
    const element = {
      clientWidth: 0,
      clientHeight: 0,
      getBoundingClientRect: () => ({ width: 200.2, height: 100.8 }),
    } as HTMLElement;
    expect(measureElementSize(element)).toEqual({ width: 200, height: 101 });
  });
});

describe("syncCanvasViewSize", () => {
  test("applies resolution and resizes the view", () => {
    const canvas = { width: 0, height: 0 };
    const ctx = {
      canvas,
      setTransform: mock(() => {}),
    } as unknown as CanvasRenderingContext2D;

    const container = {
      clientWidth: 100,
      clientHeight: 50,
      getBoundingClientRect: () => ({ width: 100, height: 50 }),
    } as HTMLElement;

    const view = {
      resize: mock(() => {}),
      flushRender: mock(() => {}),
    };

    const resolution = syncCanvasViewSize(ctx, container, view);
    expect(resolution.cssWidth).toBe(100);
    expect(resolution.cssHeight).toBe(50);
    expect(canvas.width).toBe(Math.max(1, Math.round(100 * resolution.dpr)));
    expect(view.resize).toHaveBeenCalledWith(100, 50, resolution.dpr);
    expect(view.flushRender).toHaveBeenCalledTimes(1);
  });
});

describe("bindCanvasPointerBridge", () => {
  test("dispatches chart pointer and wheel events", () => {
    const canvas = createFakeCanvas();
    const bus = createEventBus();
    const events: string[] = [];
    bus.on("pointerdown", () => events.push("pointerdown"));
    bus.on("pointerleave", () => events.push("pointerleave"));
    bus.on("wheel", () => events.push("wheel"));

    const unbind = bindCanvasPointerBridge(
      canvas as unknown as HTMLCanvasElement,
      {
        viewId: "main",
        bus,
        mode: "chart",
      },
    );

    canvas.dispatch("pointerdown", {
      pointerId: 1,
      offsetX: 10,
      offsetY: 20,
      buttons: 1,
    });
    canvas.dispatch("pointerleave", {});
    canvas.dispatch("wheel", {
      offsetX: 10,
      offsetY: 20,
      deltaY: 10,
      preventDefault: () => {},
    });

    expect(events).toEqual(["pointerdown", "pointerleave", "wheel"]);
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    unbind();
  });

  test("omits leave/wheel in y-axis mode", () => {
    const canvas = createFakeCanvas();
    const bus = createEventBus();
    const events: string[] = [];
    bus.on("pointerdown", () => events.push("pointerdown"));
    bus.on("pointerleave", () => events.push("pointerleave"));
    bus.on("wheel", () => events.push("wheel"));

    const unbind = bindCanvasPointerBridge(
      canvas as unknown as HTMLCanvasElement,
      {
        viewId: "y",
        bus,
        mode: "y-axis",
      },
    );

    canvas.dispatch("pointerdown", {
      pointerId: 1,
      offsetX: 0,
      offsetY: 0,
      buttons: 1,
    });
    canvas.dispatch("pointerleave", {});
    canvas.dispatch("wheel", {
      offsetX: 0,
      offsetY: 0,
      deltaY: 10,
      preventDefault: () => {},
    });

    expect(events).toEqual(["pointerdown"]);
    unbind();
  });

  test("dispatches pointerup on lostpointercapture", () => {
    const canvas = createFakeCanvas();
    const bus = createEventBus();
    const events: Array<{ type: string; viewId: string; pointerId: number }> =
      [];
    bus.on("pointerup", (e) =>
      events.push({ type: e.type, viewId: e.viewId, pointerId: e.pointerId }),
    );

    const unbind = bindCanvasPointerBridge(
      canvas as unknown as HTMLCanvasElement,
      {
        viewId: "main",
        bus,
        mode: "chart",
      },
    );

    canvas.dispatch("lostpointercapture", {
      pointerId: 1,
      offsetX: 10,
      offsetY: 20,
      buttons: 0,
    });

    expect(events).toEqual([
      { type: "pointerup", viewId: "main", pointerId: 1 },
    ]);
    unbind();
  });
});
