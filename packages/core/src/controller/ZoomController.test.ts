import { describe, expect, test } from "bun:test";
import { ZoomController } from "../controller/ZoomController";
import { createEventBus } from "../event/EventBus";
import { getDomainSpan, xToContinuousIndex } from "../math/viewport";
import { createInitialKeisenStateWithExampleData } from "../store/testFixtures";
import { createStore } from "../store/Store";

describe("ZoomController", () => {
  test("wheel up decreases domain span", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initialSpan = getDomainSpan(store.getState().ui.indexDomain);

    bus.dispatch({
      type: "wheel",
      viewId: "main",
      x: 500,
      y: 250,
      deltaY: -100,
    });

    const nextSpan = getDomainSpan(store.getState().ui.indexDomain);
    expect(nextSpan).toBeLessThan(initialSpan);

    controller.destroy();
  });

  test("wheel down increases domain span", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initialSpan = getDomainSpan(store.getState().ui.indexDomain);

    bus.dispatch({
      type: "wheel",
      viewId: "main",
      x: 500,
      y: 250,
      deltaY: 100,
    });

    const nextSpan = getDomainSpan(store.getState().ui.indexDomain);
    expect(nextSpan).toBeGreaterThan(initialSpan);

    controller.destroy();
  });

  test("wheel zoom keeps anchor pixel stable", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const { indexDomain, viewportWidth } = store.getState().ui;
    const anchorX = 500;
    const anchorContinuous = xToContinuousIndex(anchorX, indexDomain, viewportWidth);

    bus.dispatch({
      type: "wheel",
      viewId: "main",
      x: anchorX,
      y: 250,
      deltaY: -100,
    });

    const nextDomain = store.getState().ui.indexDomain;
    const xAfter =
      ((anchorContinuous - nextDomain.start) / getDomainSpan(nextDomain)) *
      viewportWidth;
    expect(xAfter).toBeCloseTo(anchorX, 5);

    controller.destroy();
  });

  test("ignores events from other viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "wheel",
      viewId: "volume",
      x: 500,
      y: 250,
      deltaY: -100,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("pinch in increases domain span", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initialSpan = getDomainSpan(store.getState().ui.indexDomain);

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 600,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 410,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 590,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });

    const nextSpan = getDomainSpan(store.getState().ui.indexDomain);
    expect(nextSpan).toBeGreaterThan(initialSpan);

    controller.destroy();
  });

  test("pinch out decreases domain span", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initialSpan = getDomainSpan(store.getState().ui.indexDomain);

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 600,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 390,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 610,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });

    const nextSpan = getDomainSpan(store.getState().ui.indexDomain);
    expect(nextSpan).toBeLessThan(initialSpan);

    controller.destroy();
  });

  test("pinch zoom keeps midpoint anchor pixel stable", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const { indexDomain, viewportWidth } = store.getState().ui;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 450,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 550,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });

    // 张开两指（可见域缩小），避免贴右边界时 clamp 破坏锚点
    const anchorX = 497.5;
    const anchorContinuous = xToContinuousIndex(anchorX, indexDomain, viewportWidth);

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 445,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });

    const nextDomain = store.getState().ui.indexDomain;
    const xAfter =
      ((anchorContinuous - nextDomain.start) / getDomainSpan(nextDomain)) *
      viewportWidth;
    expect(xAfter).toBeCloseTo(anchorX, 5);

    controller.destroy();
  });

  test("releases pointer on pointerup from another viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 600,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });
    bus.dispatch({
      type: "pointerup",
      viewId: "volume",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 100,
      pointerId: 2,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });

  test("releases pointer when pointermove reports buttons === 0", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new ZoomController(store, bus, "main");
    const initial = store.getState().ui.indexDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 600,
      y: 100,
      pointerId: 2,
      buttons: 3,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 400,
      y: 100,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 100,
      pointerId: 2,
      buttons: 1,
    });

    expect(store.getState().ui.indexDomain).toEqual(initial);

    controller.destroy();
  });
});
