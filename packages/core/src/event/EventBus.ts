import type { Unsubscribe } from "../store/Store";
import type { ChartEvent } from "./types";

export type EventHandler<T extends ChartEvent = ChartEvent> = (event: T) => void;

export type EventBus = {
  dispatch: (event: ChartEvent) => void;
  on: <T extends ChartEvent["type"]>(
    type: T,
    handler: (event: Extract<ChartEvent, { type: T }>) => void,
  ) => Unsubscribe;
};

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>();

  return {
    dispatch(event) {
      const set = handlers.get(event.type);
      if (!set) return;
      for (const handler of set) {
        handler(event);
      }
    },

    on(type, handler) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler as EventHandler);
      handlers.set(type, set);
      return () => set.delete(handler as EventHandler);
    },
  };
}
