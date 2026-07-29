import { describe, expect, test } from "bun:test";
import { YScrollController } from "../controller/YScrollController";
import { createEventBus } from "../event/EventBus";
import { createInitialKeisenStateWithExampleData } from "../store/testFixtures";
import { createStore, type KeisenState, type Store } from "../store/Store";
import type { ChartDataState } from "../types/kline";

const enableManualYAxis = (store: Store<KeisenState<ChartDataState>>) => {
  store.setState((prev) => ({
    ...prev,
    ui: {
      ...prev.ui,
      yAxisMode: "manual",
    },
  }));
};

describe("YScrollController", () => {
  test("ends drag on pointerup from another viewId", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    enableManualYAxis(store);
    const bus = createEventBus();
    const controller = new YScrollController(store, bus, "main");
    const initial = store.getState().ui.priceDomain;

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
      x: 100,
      y: 120,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.priceDomain).toEqual(initial);

    controller.destroy();
  });

  test("ends drag when pointermove reports buttons === 0", () => {
    const store = createStore(createInitialKeisenStateWithExampleData());
    enableManualYAxis(store);
    const bus = createEventBus();
    const controller = new YScrollController(store, bus, "main");
    const initial = store.getState().ui.priceDomain;

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
      x: 100,
      y: 120,
      pointerId: 1,
      buttons: 0,
    });

    expect(store.getState().ui.priceDomain).toEqual(initial);

    controller.destroy();
  });
});
