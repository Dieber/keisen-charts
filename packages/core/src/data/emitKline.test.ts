import { describe, expect, test } from "bun:test";

import { createKeisenStore } from "../store/createKeisenStore";
import { replaceKlineInStore } from "./klineMutations";
import { createSubscribeEmit } from "./emitKline";
import type { DataContext } from "./types";
import type { KlineBar } from "../types/kline";

const ctx = (cacheKey = "BTC:1"): DataContext => ({
  cacheKey,
  resolution: "1",
  symbol: "BTC",
});

const bar = (t: number, c = 100): KlineBar => ({
  t,
  o: c,
  h: c,
  l: c,
  c,
  v: 1,
});

describe("createSubscribeEmit", () => {
  test("bar updates last when t matches", () => {
    const store = createKeisenStore();
    replaceKlineInStore(store, [bar(1000, 10), bar(2000, 20)]);
    const emit = createSubscribeEmit(store, () => ctx(), ctx());

    emit.bar(bar(2000, 25));

    const kline = store.getState().data.kline;
    expect(kline).toHaveLength(2);
    expect(kline[1]?.c).toBe(25);
  });

  test("bar appends when t is greater", () => {
    const store = createKeisenStore();
    replaceKlineInStore(store, [bar(1000), bar(2000)]);
    const emit = createSubscribeEmit(store, () => ctx(), ctx());

    emit.bar(bar(3000, 30));

    const kline = store.getState().data.kline;
    expect(kline).toHaveLength(3);
    expect(kline[2]?.t).toBe(3000);
  });

  test("bar ignores older t", () => {
    const store = createKeisenStore();
    replaceKlineInStore(store, [bar(1000), bar(2000, 20)]);
    const emit = createSubscribeEmit(store, () => ctx(), ctx());

    emit.bar(bar(1500, 15));

    const kline = store.getState().data.kline;
    expect(kline).toHaveLength(2);
    expect(kline[1]?.c).toBe(20);
  });

  test("bar seeds empty series", () => {
    const store = createKeisenStore();
    const emit = createSubscribeEmit(store, () => ctx(), ctx());

    emit.bar(bar(1000, 10));

    expect(store.getState().data.kline).toEqual([bar(1000, 10)]);
  });

  test("stale context drops all emit methods", () => {
    const store = createKeisenStore();
    replaceKlineInStore(store, [bar(1000)]);
    const emit = createSubscribeEmit(store, () => ctx("ETH:1"), ctx("BTC:1"));

    emit.bar(bar(1000, 99));
    emit.append(bar(2000));
    emit.updateLast(bar(1000, 99));
    emit.replace([bar(3000)]);

    expect(store.getState().data.kline).toEqual([bar(1000)]);
  });
});
