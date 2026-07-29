import { describe, expect, test } from "bun:test";

import { createEventBus } from "../event/EventBus";
import { createStore } from "../store/Store";
import { createInitialKeisenStateWithExampleData } from "../store/testFixtures";
import { DrawingController, drawingsActions } from "./DrawingController";
import { buildDrawingHelpers } from "./projectHelpers";

const setup = () => {
  const store = createStore(createInitialKeisenStateWithExampleData());
  const bus = createEventBus();
  const controller = new DrawingController(store, bus);
  return { store, bus, controller };
};

const pointer = (
  type: "pointerdown" | "pointermove" | "pointerup",
  x: number,
  y: number,
  buttons = type === "pointerup" ? 0 : 1,
) => ({
  type,
  viewId: "main" as const,
  x,
  y,
  pointerId: 1,
  buttons,
});

describe("DrawingController", () => {
  test("setOverlay + pointerdown commits horizontal line", () => {
    const { store, bus, controller } = setup();

    drawingsActions.setActiveTool(store, "horizontal");
    expect(store.getState().ui.drawings.activeTool).toBe("horizontal");

    bus.dispatch(pointer("pointerdown", 100, 50));

    const { items, activeTool, draft } = store.getState().ui.drawings;
    const drawings = Object.values(items);
    expect(drawings).toHaveLength(1);
    expect(drawings[0]!.tool).toBe("horizontal");
    expect(drawings[0]!.editable).toBe(true);
    expect(activeTool).toBeNull();
    expect(draft).toBeNull();

    controller.destroy();
  });

  test("ray needs two clicks", () => {
    const { store, bus, controller } = setup();

    drawingsActions.setActiveTool(store, "ray");
    bus.dispatch(pointer("pointerdown", 40, 40));
    expect(store.getState().ui.drawings.draft?.points).toHaveLength(1);

    bus.dispatch(pointer("pointerdown", 80, 60));
    expect(Object.values(store.getState().ui.drawings.items)).toHaveLength(1);
    expect(store.getState().ui.drawings.draft).toBeNull();

    controller.destroy();
  });

  test("ray pointermove writes draft.preview after first click", () => {
    const { store, bus, controller } = setup();

    drawingsActions.setActiveTool(store, "ray");
    bus.dispatch(pointer("pointerdown", 40, 40));
    bus.dispatch(pointer("pointermove", 120, 90, 0));

    const draft = store.getState().ui.drawings.draft;
    expect(draft?.points).toHaveLength(1);
    expect(draft?.preview).toBeTruthy();
    expect(draft!.preview!.barIndex).not.toBe(draft!.points[0]!.barIndex);

    controller.destroy();
  });

  test("parallelLines keeps preview while placing third point", () => {
    const { store, bus, controller } = setup();

    drawingsActions.setActiveTool(store, "parallelLines");
    bus.dispatch(pointer("pointerdown", 40, 40));
    bus.dispatch(pointer("pointerdown", 120, 80));
    expect(store.getState().ui.drawings.draft?.points).toHaveLength(2);

    bus.dispatch(pointer("pointermove", 100, 140, 0));
    const draft = store.getState().ui.drawings.draft;
    expect(draft?.points).toHaveLength(2);
    expect(draft?.preview).toBeTruthy();

    bus.dispatch(pointer("pointerdown", 100, 140));
    expect(Object.values(store.getState().ui.drawings.items)).toHaveLength(1);
    expect(store.getState().ui.drawings.draft).toBeNull();

    controller.destroy();
  });

  test("addDrawing creates programmatic shape with editable default true", () => {
    const { store, controller } = setup();
    const id = drawingsActions.addDrawing(store, {
      tool: "priceChannel",
      paneId: "main",
      points: [{ barIndex: 10, value: 1.23 }],
      style: { stroke: "#f59e0b", lineWidth: 1 },
    });
    expect(store.getState().ui.drawings.items[id]?.tool).toBe("priceChannel");
    expect(store.getState().ui.drawings.items[id]?.editable).toBe(true);
    controller.destroy();
  });

  test("move gesture translates all points of editable drawing", () => {
    const { store, bus, controller } = setup();
    const id = drawingsActions.addDrawing(store, {
      tool: "horizontal",
      paneId: "main",
      points: [{ barIndex: 20, value: 100 }],
      editable: true,
    });

    const ui = store.getState().ui;
    const helpers = buildDrawingHelpers({
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    });
    const x0 = helpers.xOfBar(20);
    const y0 = helpers.yOfValue(100);

    bus.dispatch(pointer("pointerdown", x0, y0));
    expect(store.getState().ui.drawings.selectedIds).toEqual([id]);
    expect(store.getState().ui.drawings.gesture?.kind).toBe("move");

    bus.dispatch(pointer("pointermove", x0, y0 + 30));
    const moved = store.getState().ui.drawings.items[id]!;
    expect(moved.points[0]!.value).not.toBeCloseTo(100, 5);

    bus.dispatch(pointer("pointerup", x0, y0 + 30));
    expect(store.getState().ui.drawings.gesture).toBeNull();

    controller.destroy();
  });

  test("resize gesture updates a single anchor via handle", () => {
    const { store, bus, controller } = setup();
    const id = drawingsActions.addDrawing(store, {
      tool: "ray",
      paneId: "main",
      points: [
        { barIndex: 10, value: 110 },
        { barIndex: 40, value: 90 },
      ],
      editable: true,
    });

    const ui = store.getState().ui;
    const helpers = buildDrawingHelpers({
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    });
    const hx = helpers.xOfBar(40);
    const hy = helpers.yOfValue(90);

    // 先选中（点在射线上）
    const midX = helpers.xOfBar(25);
    const midY = helpers.yOfValue(100);
    bus.dispatch(pointer("pointerdown", midX, midY));
    bus.dispatch(pointer("pointerup", midX, midY));
    expect(store.getState().ui.drawings.selectedIds).toEqual([id]);

    // 拖第二个手柄
    bus.dispatch(pointer("pointerdown", hx, hy));
    expect(store.getState().ui.drawings.gesture?.kind).toBe("resize");
    expect(store.getState().ui.drawings.gesture?.pointIndex).toBe(1);

    bus.dispatch(pointer("pointermove", hx + 40, hy - 20));
    const resized = store.getState().ui.drawings.items[id]!;
    expect(resized.points[0]!.barIndex).toBeCloseTo(10, 5);
    expect(resized.points[1]!.barIndex).not.toBeCloseTo(40, 5);

    bus.dispatch(pointer("pointerup", hx + 40, hy - 20));
    controller.destroy();
  });

  test("editable:false selects but does not start gesture", () => {
    const { store, bus, controller } = setup();
    const id = drawingsActions.addDrawing(store, {
      tool: "horizontal",
      paneId: "main",
      points: [{ barIndex: 15, value: 105 }],
      editable: false,
    });

    const ui = store.getState().ui;
    const helpers = buildDrawingHelpers({
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    });
    const x = helpers.xOfBar(15);
    const y = helpers.yOfValue(105);

    bus.dispatch(pointer("pointerdown", x, y));
    expect(store.getState().ui.drawings.selectedIds).toEqual([id]);
    expect(store.getState().ui.drawings.gesture).toBeNull();

    controller.destroy();
  });

  test("hover sets pointer cursor; drag sets grabbing", () => {
    const { store, bus, controller } = setup();
    drawingsActions.addDrawing(store, {
      tool: "horizontal",
      paneId: "main",
      points: [{ barIndex: 20, value: 100 }],
      editable: true,
    });

    const ui = store.getState().ui;
    const helpers = buildDrawingHelpers({
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    });
    const x = helpers.xOfBar(20);
    const y = helpers.yOfValue(100);

    bus.dispatch(pointer("pointermove", x, y, 0));
    expect(store.getState().ui.drawings.cursor).toBe("pointer");

    bus.dispatch(pointer("pointerdown", x, y));
    expect(store.getState().ui.drawings.cursor).toBe("grabbing");

    bus.dispatch(pointer("pointerup", x, y));
    expect(store.getState().ui.drawings.cursor).toBe("pointer");

    bus.dispatch(pointer("pointermove", x, y + 80, 0));
    expect(store.getState().ui.drawings.cursor).toBeNull();

    controller.destroy();
  });
});
