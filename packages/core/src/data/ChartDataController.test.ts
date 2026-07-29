import { describe, expect, test } from "bun:test";

import { createKeisenStore } from "../store/createKeisenStore";
import { createSampleKline } from "../store/testFixtures";
import { ChartDataController } from "./ChartDataController";
import { setDataMeta } from "./klineMutations";

describe("ChartDataController", () => {
  test("controlled data replaces store kline", () => {
    const store = createKeisenStore();
    const bars = createSampleKline(8);
    const controller = new ChartDataController(store, {
      data: bars,
      resolution: "1",
      symbol: "BTC",
    });

    expect(store.getState().data.kline).toHaveLength(8);
    expect(store.getState().data.meta?.symbol).toBe("BTC");
    controller.dispose();
  });

  test("getData loads history and ignores stale responses", async () => {
    const store = createKeisenStore();
    let resolveFirst!: (bars: ReturnType<typeof createSampleKline>) => void;
    let resolveSecond!: (bars: ReturnType<typeof createSampleKline>) => void;

    const first = new Promise<ReturnType<typeof createSampleKline>>((resolve) => {
      resolveFirst = resolve;
    });
    const second = new Promise<ReturnType<typeof createSampleKline>>((resolve) => {
      resolveSecond = resolve;
    });

    let call = 0;
    const controller = new ChartDataController(store, {
      resolution: "1",
      symbol: "A",
      getData: async ({ symbol }) => {
        call += 1;
        if (symbol === "A") return first;
        return second;
      },
    });

    // switch before first resolves
    controller.setOptions({
      resolution: "1",
      symbol: "B",
      getData: async ({ symbol }) => {
        call += 1;
        if (symbol === "A") return first;
        return second;
      },
    });

    const barsA = createSampleKline(3);
    const barsB = createSampleKline(5);
    resolveFirst(barsA);
    resolveSecond(barsB);

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getState().data.kline).toHaveLength(5);
    expect(store.getState().data.meta?.symbol).toBe("B");
    expect(call).toBeGreaterThanOrEqual(2);
    controller.dispose();
  });

  test("symbol change preserves store resolution after hook switch", async () => {
    const store = createKeisenStore();
    const calls: Array<{ symbol?: string; resolution: string }> = [];

    const controller = new ChartDataController(store, {
      resolution: "1",
      symbol: "A",
      getData: async ({ symbol, resolution }) => {
        calls.push({ symbol, resolution });
        return createSampleKline(4);
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().data.meta?.resolution).toBe("1");

    setDataMeta(store, { resolution: "5" });
    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().data.meta?.resolution).toBe("5");

    controller.setOptions({
      resolution: "1",
      symbol: "B",
      getData: async ({ symbol, resolution }) => {
        calls.push({ symbol, resolution });
        return createSampleKline(4);
      },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getState().data.meta?.resolution).toBe("5");
    expect(store.getState().data.meta?.symbol).toBe("B");
    expect(calls.at(-1)).toEqual({ symbol: "B", resolution: "5" });
    controller.dispose();
  });

  test("dispose tears down subscription", () => {
    const store = createKeisenStore();
    let cleaned = false;
    const controller = new ChartDataController(store, {
      data: createSampleKline(2),
      resolution: "1",
      onSubscribe: () => () => {
        cleaned = true;
      },
    });

    controller.dispose();
    expect(cleaned).toBe(true);
  });

  test("context switch keeps old viewport until ready, then binds subscribe", async () => {
    const store = createKeisenStore();
    let resolveBars!: (bars: ReturnType<typeof createSampleKline>) => void;
    const pending = new Promise<ReturnType<typeof createSampleKline>>(
      (resolve) => {
        resolveBars = resolve;
      },
    );

    let subscribeCount = 0;
    const controller = new ChartDataController(store, {
      resolution: "1",
      symbol: "A",
      getData: async () => createSampleKline(10),
      onSubscribe: () => {
        subscribeCount += 1;
        return () => {};
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().data.meta?.status).toBe("ready");
    expect(subscribeCount).toBe(1);

    const indexBefore = { ...store.getState().ui.indexDomain };

    controller.setOptions({
      resolution: "1",
      symbol: "B",
      getData: async () => pending,
      onSubscribe: () => {
        subscribeCount += 1;
        return () => {};
      },
    });

    await Promise.resolve();
    expect(store.getState().data.meta?.status).toBe("loading");
    expect(store.getState().data.kline).toHaveLength(10);
    expect(store.getState().ui.indexDomain).toEqual(indexBefore);
    expect(subscribeCount).toBe(1);

    resolveBars(createSampleKline(6));
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getState().data.meta?.status).toBe("ready");
    expect(store.getState().data.kline).toHaveLength(6);
    expect(store.getState().data.meta?.symbol).toBe("B");
    expect(subscribeCount).toBe(2);
    controller.dispose();
  });
});
