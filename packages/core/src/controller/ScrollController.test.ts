import { describe, expect, test } from "bun:test";
import { ScrollController } from "../controller/ScrollController";
import { createEventBus } from "../event/EventBus";
import { getDomainSpan } from "../math/viewport";
import { createInitialKeisenStateWithExampleData } from "../store/testFixtures";
import { createStore } from "../store/Store";

describe("ScrollController", () => {
  test("pointer drag decreases indexDomain when dragging right", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;
    const span = getDomainSpan(initial);
    const viewportWidth = store.getState().ui.viewportWidth;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 130,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });

    const next = store.getState().ui.indexDomain;
    const expectedDelta = (30 / viewportWidth) * span;
    expect(next.start).toBeCloseTo(initial.start - expectedDelta, 5);
    expect(next.end).toBeCloseTo(initial.end - expectedDelta, 5);

    controller.destroy();
  });

  test("ignores events from other viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "volume",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "volume",
      x: 200,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("clamps indexDomain at right padding boundary", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initialEnd = store.getState().ui.indexDomain.end;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 0,
      y: 0,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: -500,
      y: 0,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain.end).toBeCloseTo(initialEnd, 5);

    controller.destroy();
  });

  test("does not pan while two pointers are active", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 200,
      y: 50,
      pointerId: 2,
      buttons: 3,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 130,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("ends drag on pointerup from another viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerup",
      viewId: "volume",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 160,
      y: 50,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("ends drag when pointermove reports buttons === 0", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 160,
      y: 50,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("yields pan while drawings.gesture is active", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ScrollController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    store.setState((s) => ({
      ...s,
      ui: {
        ...s.ui,
        drawings: {
          ...s.ui.drawings,
          gesture: {
            kind: "move",
            drawingId: "drawing-1",
            startPointer: { x: 100, y: 50 },
            startPoints: [{ barIndex: 10, time: 0, value: 1 }],
          },
        },
      },
    }));

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 160,
      y: 50,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });
});
