import { describe, expect, test } from "bun:test";

import { getBuiltinIndicatorMetas } from "./builtinMetas";
import { resolveIndicatorComposePlan } from "./composePlan";
import { createIndicatorController } from "./createIndicatorController";

describe("getBuiltinIndicatorMetas", () => {
  test("returns cloned builtin metas with main and pane groups", () => {
    const metas = getBuiltinIndicatorMetas();
    expect(metas.some((m) => m.id === "ma" && m.group === "main")).toBe(true);
    expect(metas.some((m) => m.id === "macd" && m.group === "pane")).toBe(true);
    expect(metas.some((m) => m.id === "bias")).toBe(false);

    metas[0]!.defaultSetting.visible = false;
    expect(getBuiltinIndicatorMetas()[0]!.defaultSetting.visible).toBe(true);
  });
});

describe("resolveIndicatorComposePlan", () => {
  test("omits hidden indicators and includes visible ones", () => {
    const controller = createIndicatorController();
    controller.setVisible("ma", false);
    controller.setVisible("rsi", true);
    const plan = controller.getComposePlan();

    expect(plan.mainLayers.some((layer) => layer.kind === "ma")).toBe(false);
    expect(plan.mainLayers.some((layer) => layer.kind === "ema")).toBe(true);
    expect(plan.paneCharts.some((pane) => pane.kind === "rsi")).toBe(true);
    expect(plan.paneCharts.some((pane) => pane.kind === "macd")).toBe(true);
  });

  test("includes visible extras", () => {
    const plan = resolveIndicatorComposePlan(
      {
        ma: { visible: false, colors: {} },
        bias: { visible: true, colors: { bias: "#ae3ec9" } },
      },
      {
        extras: [
          {
            id: "bias",
            meta: {
              group: "pane",
              label: "BIAS",
              colorLabels: { bias: "BIAS6" },
            },
          },
        ],
      },
    );

    expect(plan.paneCharts).toEqual([
      {
        kind: "extra",
        id: "bias",
        setting: { visible: true, colors: { bias: "#ae3ec9" } },
      },
    ]);
  });
});

describe("createIndicatorController", () => {
  test("notifies subscribers on settings changes", () => {
    const controller = createIndicatorController();
    let calls = 0;
    const unsub = controller.subscribe(() => {
      calls += 1;
    });

    controller.setVisible("rsi", true);
    controller.setColor("rsi", "rsi6", "#ffffff");
    expect(calls).toBe(2);

    unsub();
    controller.setVisible("rsi", false);
    expect(calls).toBe(2);
  });

  test("applies defaults and exposes panel props", () => {
    const controller = createIndicatorController({
      defaults: { rsi: { visible: true } },
      extras: [
        {
          id: "bias",
          meta: {
            group: "pane",
            label: "BIAS",
            colorLabels: { bias: "BIAS6" },
          },
          defaultSetting: { visible: false, colors: { bias: "#ae3ec9" } },
        },
      ],
    });

    const panel = controller.getPanelProps();
    expect(panel.settings.rsi.visible).toBe(true);
    expect(panel.settings.bias.visible).toBe(false);
    expect(
      panel.groups
        .flatMap((group) => group.indicators)
        .some((item) => item.id === "bias"),
    ).toBe(true);

    panel.setVisible("bias", true);
    expect(controller.getSnapshot().bias.visible).toBe(true);
    expect(
      controller.getComposePlan().paneCharts.some(
        (pane) => pane.kind === "extra" && pane.id === "bias",
      ),
    ).toBe(true);
  });

  test("setParams updates snapshot and compose plan", () => {
    const controller = createIndicatorController();
    controller.setParams("ma", { periods: [5, 10] });
    expect(controller.getSnapshot().ma.params).toEqual({ periods: [5, 10] });
    const maLayer = controller
      .getComposePlan()
      .mainLayers.find((layer) => layer.kind === "ma");
    expect(maLayer).toEqual({
      kind: "ma",
      periods: [5, 10],
      colors: expect.any(Object),
    });
  });

  test("boll params flow into compose plan", () => {
    const controller = createIndicatorController();
    controller.setParams("boll", { period: 30, stdDev: 2.5 });
    const boll = controller
      .getComposePlan()
      .mainLayers.find((layer) => layer.kind === "boll");
    expect(boll).toMatchObject({
      kind: "boll",
      period: 30,
      stdDev: 2.5,
    });
  });

  test("reset restores defaults snapshot", () => {
    const controller = createIndicatorController();
    controller.setVisible("rsi", true);
    controller.setParams("boll", { period: 40, stdDev: 3 });
    controller.reset();
    expect(controller.getSnapshot().rsi.visible).toBe(false);
    expect(controller.getSnapshot().boll.params).toEqual({
      period: 20,
      stdDev: 2,
    });
  });
});
