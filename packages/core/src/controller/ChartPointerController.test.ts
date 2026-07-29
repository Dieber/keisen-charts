import { describe, expect, test } from "bun:test";
import { ChartPointerController } from "./ChartPointerController";
import { createEventBus } from "../event/EventBus";
import { createInitialKeisenState } from "../store/createKeisenStore";
import { createStore } from "../store/Store";
import type { ChartPointerInfo } from "../interaction/resolveChartPointer";
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
  createStore(createInitialKeisenState({ kline: sampleKline }));

describe("ChartPointerController", () => {
  test("pointermove emits ChartPointerInfo", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const moves: Array<ChartPointerInfo | null> = [];
    const controller = new ChartPointerController(store, bus, {
      onPointerMove: (info) => moves.push(info),
    });

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 0,
      pointerType: "mouse",
    });

    expect(moves).toHaveLength(1);
    expect(moves[0]?.chartId).toBe("main");
    expect(moves[0]?.pointerType).toBe("mouse");
    expect(moves[0]?.y).toBe(200);

    controller.destroy();
  });

  test("pointerleave emits null once", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const moves: Array<ChartPointerInfo | null> = [];
    const controller = new ChartPointerController(store, bus, {
      onPointerMove: (info) => moves.push(info),
    });

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 0,
    });
    bus.dispatch({ type: "pointerleave", viewId: "main" });
    bus.dispatch({ type: "pointerleave", viewId: "main" });

    expect(moves).toHaveLength(2);
    expect(moves[1]).toBeNull();

    controller.destroy();
  });

  test("ignores hover while dragging", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const moves: Array<ChartPointerInfo | null> = [];
    const controller = new ChartPointerController(store, bus, {
      onPointerMove: (info) => moves.push(info),
    });

    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 500,
      y: 200,
      pointerId: 1,
      buttons: 1,
    });

    expect(moves).toHaveLength(0);
    controller.destroy();
  });

  test("click fires on short press without drag", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const clicks: ChartPointerInfo[] = [];
    const controller = new ChartPointerController(store, bus, {
      onClick: (info) => clicks.push(info),
    });

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 150,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerup",
      viewId: "main",
      x: 402,
      y: 151,
      pointerId: 1,
      buttons: 0,
    });

    expect(clicks).toHaveLength(1);
    expect(clicks[0]?.chartId).toBe("main");
    controller.destroy();
  });

  test("click does not fire after drag", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const clicks: ChartPointerInfo[] = [];
    const controller = new ChartPointerController(store, bus, {
      onClick: (info) => clicks.push(info),
    });

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 400,
      y: 150,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointermove",
      viewId: "main",
      x: 450,
      y: 150,
      pointerId: 1,
      buttons: 1,
    });
    bus.dispatch({
      type: "pointerup",
      viewId: "main",
      x: 450,
      y: 150,
      pointerId: 1,
      buttons: 0,
    });

    expect(clicks).toHaveLength(0);
    controller.destroy();
  });

  test("setHandlers updates callbacks", () => {
    const store = createTestStore();
    const bus = createEventBus();
    const first: ChartPointerInfo[] = [];
    const second: ChartPointerInfo[] = [];
    const controller = new ChartPointerController(store, bus, {
      onPointerDown: (info) => first.push(info),
    });

    controller.setHandlers({
      onPointerDown: (info) => second.push(info),
    });

    bus.dispatch({
      type: "pointerdown",
      viewId: "main",
      x: 100,
      y: 100,
      pointerId: 1,
      buttons: 1,
    });

    expect(first).toHaveLength(0);
    expect(second).toHaveLength(1);
    controller.destroy();
  });
});
