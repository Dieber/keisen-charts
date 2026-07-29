import { describe, expect, test } from "bun:test";
import { createStore } from "./Store";

type TestState = {
  count: number;
  name: string;
  nested: { value: number };
};

const createTestState = (): TestState => ({
  count: 0,
  name: "initial",
  nested: { value: 1 },
});

describe("createStore", () => {
  test("getState returns initial state", () => {
    const initialState = createTestState();
    const store = createStore(initialState);

    expect(store.getState()).toEqual(initialState);
  });

  test("setState replaces state with a new object", () => {
    const store = createStore(createTestState());

    store.setState({ count: 1, name: "updated", nested: { value: 2 } });

    expect(store.getState()).toEqual({
      count: 1,
      name: "updated",
      nested: { value: 2 },
    });
  });

  test("setState accepts an updater function", () => {
    const store = createStore(createTestState());

    store.setState((prev) => ({
      ...prev,
      count: prev.count + 1,
      nested: { value: prev.nested.value + 1 },
    }));

    expect(store.getState()).toEqual({
      count: 1,
      name: "initial",
      nested: { value: 2 },
    });
  });

  test("subscribe notifies listener with next and previous state", () => {
    const store = createStore(createTestState());
    const calls: Array<{ state: TestState; prevState: TestState }> = [];

    store.subscribe((state, prevState) => {
      calls.push({ state, prevState });
    });

    store.setState((prev) => ({ ...prev, count: 1 }));
    store.setState((prev) => ({ ...prev, count: 2 }));
    
    expect(calls).toHaveLength(2);
    expect(calls[0]?.prevState.count).toBe(0);
    expect(calls[0]?.state.count).toBe(1);
    expect(calls[1]?.prevState.count).toBe(1);
    expect(calls[1]?.state.count).toBe(2);
  });

  test("unsubscribe stops full-state notifications", () => {
    const store = createStore(createTestState());
    let callCount = 0;

    const unsubscribe = store.subscribe(() => {
      callCount += 1;
    });

    store.setState((prev) => ({ ...prev, count: 1 }));
    unsubscribe();
    store.setState((prev) => ({ ...prev, count: 2 }));

    expect(callCount).toBe(1);
  });

  test("subscribeSlice notifies only when selected slice changes", () => {
    const store = createStore(createTestState());
    const countChanges: Array<{ slice: number; prevSlice: number }> = [];

    store.subscribeSlice(
      (state) => state.count,
      (slice, prevSlice) => {
        countChanges.push({ slice, prevSlice });
      },
    );

    store.setState((prev) => ({ ...prev, count: 1 }));
    store.setState((prev) => ({ ...prev, name: "unchanged count" }));
    store.setState((prev) => ({ ...prev, count: 2 }));

    expect(countChanges).toEqual([
      { slice: 1, prevSlice: 0 },
      { slice: 2, prevSlice: 1 },
    ]);
  });

  test("subscribeSlice uses custom equals to suppress notifications", () => {
    const store = createStore(createTestState());
    let callCount = 0;

    store.subscribeSlice(
      (state) => state.nested,
      () => {
        callCount += 1;
      },
      (a, b) => a.value === b.value,
    );

    store.setState((prev) => ({
      ...prev,
      nested: { value: prev.nested.value },
    }));
    store.setState((prev) => ({
      ...prev,
      nested: { value: prev.nested.value + 1 },
    }));

    expect(callCount).toBe(1);
  });

  test("unsubscribe stops slice notifications", () => {
    const store = createStore(createTestState());
    let callCount = 0;

    const unsubscribe = store.subscribeSlice(
      (state) => state.count,
      () => {
        callCount += 1;
      },
    );

    store.setState((prev) => ({ ...prev, count: 1 }));
    unsubscribe();
    store.setState((prev) => ({ ...prev, count: 2 }));

    expect(callCount).toBe(1);
  });

  test("full subscribe and slice subscribe both receive updates", () => {
    const store = createStore(createTestState());
    let fullCallCount = 0;
    let sliceCallCount = 0;

    store.subscribe(() => {
      fullCallCount += 1;
    });
    store.subscribeSlice(
      (state) => state.name,
      () => {
        sliceCallCount += 1;
      },
    );

    store.setState((prev) => ({ ...prev, name: "updated" }));

    expect(fullCallCount).toBe(1);
    expect(sliceCallCount).toBe(1);
  });
});
