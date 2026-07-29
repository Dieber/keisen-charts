import { describe, expect, test } from "bun:test";
import {
  YZoomController,
  klineYZoomConfig,
} from "../controller/YZoomController";
import { createEventBus } from "../event/EventBus";
import { getPriceRange } from "../math/priceViewport";
import { createInitialKeisenStateWithExampleData } from "../store/testFixtures";
import { createStore } from "../store/Store";

describe("YZoomController", () => {
  test("drag down increases price domain range", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const initialRange = getPriceRange(store.getState().ui.priceDomain);

    bus.dispatch({
      type: "pointerdown",
      viewId: "kline-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "kline-y-axis",
      x: 10,
      y: 140,
      pointerId: 1,
      buttons: 1,
    });

    const nextRange = getPriceRange(store.getState().ui.priceDomain);
    expect(nextRange).toBeGreaterThan(initialRange);
    expect(store.getState().ui.yAxisMode).toBe("manual");

    controller.destroy();
  });

  test("drag up decreases price domain range", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const initialRange = getPriceRange(store.getState().ui.priceDomain);

    bus.dispatch({
      type: "pointerdown",
      viewId: "kline-y-axis",
      x: 10,
      y: 140,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "kline-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });

    const nextRange = getPriceRange(store.getState().ui.priceDomain);
    expect(nextRange).toBeLessThan(initialRange);
    expect(store.getState().ui.yAxisMode).toBe("manual");

    controller.destroy();
  });

  test("ignores events from other viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const initial = store.getState().ui.priceDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "other-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "other-y-axis",
      x: 10,
      y: 140,
      pointerId: 1,
      buttons: 1,
    });

    expect(store.getState().ui.priceDomain).toEqual(initial);

    controller.destroy();
  });

  test("keeps domain midpoint stable while dragging", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const { priceDomain } = store.getState().ui;
    const mid = (priceDomain.min + priceDomain.max) / 2;

    bus.dispatch({
      type: "pointerdown",
      viewId: "kline-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "kline-y-axis",
      x: 10,
      y: 160,
      pointerId: 1,
      buttons: 1,
    });

    const next = store.getState().ui.priceDomain;
    expect((next.min + next.max) / 2).toBeCloseTo(mid, 10);

    controller.destroy();
  });

  test("ends drag on pointerup from another viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const initial = store.getState().ui.priceDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "kline-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerup",
      viewId: "other-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "kline-y-axis",
      x: 10,
      y: 160,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.priceDomain).toEqual(initial);

    controller.destroy();
  });

  test("ends drag when pointermove reports buttons === 0", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    const bus = createEventBus();
    const controller = new YZoomController(store, bus, klineYZoomConfig);
    const initial = store.getState().ui.priceDomain;

    bus.dispatch({
      type: "pointerdown",
      viewId: "kline-y-axis",
      x: 10,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "kline-y-axis",
      x: 10,
      y: 160,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.priceDomain).toEqual(initial);

    controller.destroy();
  });
});
