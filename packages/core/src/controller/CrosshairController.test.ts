import { describe, expect, test } from "bun:test";
import { CrosshairController } from "../controller/CrosshairController";
import { createEventBus } from "../event/EventBus";
import { createInitialKeisenState } from "../store/createKeisenStore";
import { createStore } from "../store/Store";
import type { KlineBar } from "../types/kline";

const sampleKline: KlineBar[] = Array.from({ length: 100 }, (_, i) => ({
  t: 1_700_000_000_000 + i * 60_000,
  o: 100 + i * 0.1,
  h: 101 + i * 0.1,
  l: 99 + i * 0.1,
  c: 100.5 + i * 0.1,
  v: 1000 + i,
}));

const createTestStore = () =>
  createStore(
    createInitialKeisenState({
      kline: sampleKline,
    }),
  );

describe("CrosshairController", () => {
  test("pointermove writes crosshair state", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const controller = new CrosshairController(store, bus);

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 0,
    });

    const crosshair = store.getState().ui.crosshair;
    expect(crosshair).not.toBeNull();
    expect(crosshair?.sourceViewId).toBe("main");
    expect(crosshair?.localY).toBe(200);
    expect(crosshair?.barIndex).toBeGreaterThanOrEqual(0);

    controller.destroy();
  });

  test("pointerleave clears crosshair", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const controller = new CrosshairController(store, bus);

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({ type: "pointerleave", viewId: "main" });

    expect(store.getState().ui.crosshair).toBeNull();

    controller.destroy();
  });

  test("ignores pointermove while dragging", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const controller = new CrosshairController(store, bus);

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.crosshair).toBeNull();

    controller.destroy();
  });

  test("volume view updates crosshair sourceViewId", () => {
    const store = createTestStore();
    store.setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        panes: {
          ...prev.ui.panes,
          volume: {
            domain: { min: 0, max: 1 },
            viewportHeight: 120,
            yAxisMode: "auto",
          },
        },
      },
    }));
    const bus = createEventBus();
    const controller = new CrosshairController(store, bus);

    bus.dispatch({
      type: "pointermove",
      viewId: "volume",
      x: 300,
      y: 50,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.crosshair?.sourceViewId).toBe("volume");

    controller.destroy();
  });
});
