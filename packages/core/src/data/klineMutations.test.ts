import { describe, expect, test } from "bun:test";

import { createKeisenStore } from "../store/createKeisenStore";
import { createSampleKline } from "../store/testFixtures";
import {
  appendBarInStore,
  prependBarsInStore,
  replaceKlineInStore,
  setDataMeta,
  updateLastBarInStore,
} from "./klineMutations";

describe("klineMutations", () => {
  test("replaceKlineInStore sets bars and ready meta", () => {
    const store = createKeisenStore();
    const bars = createSampleKline(10);
    replaceKlineInStore(store, bars, { resolution: "5", symbol: "ETH" });

    const state = store.getState();
    expect(state.data.kline).toHaveLength(10);
    expect(state.data.meta?.status).toBe("ready");
    expect(state.data.meta?.resolution).toBe("5");
    expect(state.data.meta?.symbol).toBe("ETH");
  });

  test("prependBarsInStore shifts indexDomain", () => {
    const store = createKeisenStore();
    const bars = createSampleKline(20);
    replaceKlineInStore(store, bars);

    const before = store.getState().ui.indexDomain;
    const older = createSampleKline(5).map((bar, i) => ({
      ...bar,
      t: bars[0]!.t - (5 - i) * 60_000,
    }));

    const count = prependBarsInStore(store, older);
    expect(count).toBe(5);
    const after = store.getState().ui.indexDomain;
    expect(after.start).toBe(before.start + 5);
    expect(after.end).toBe(before.end + 5);
    expect(store.getState().data.kline).toHaveLength(25);
  });

  test("append and updateLast", () => {
    const store = createKeisenStore();
    const bars = createSampleKline(3);
    replaceKlineInStore(store, bars);

    const next = {
      ...bars[2]!,
      t: bars[2]!.t + 60_000,
      c: 999,
    };
    appendBarInStore(store, next);
    expect(store.getState().data.kline).toHaveLength(4);

    updateLastBarInStore(store, { ...next, c: 1001 });
    expect(store.getState().data.kline.at(-1)?.c).toBe(1001);
  });

  test("setDataMeta merges patch", () => {
    const store = createKeisenStore();
    setDataMeta(store, { status: "loading", resolution: "15" });
    expect(store.getState().data.meta?.status).toBe("loading");
    expect(store.getState().data.meta?.resolution).toBe("15");
  });
});
