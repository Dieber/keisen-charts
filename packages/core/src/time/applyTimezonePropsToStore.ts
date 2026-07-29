import type { KeisenState, Store } from "../store/Store";
import type { ChartDataState } from "../types/kline";
import type { KlineTimezone } from "./types";
import { resolveTimezone } from "./resolveTimezone";

/** 将 timezone prop 写入 store */
export const applyTimezonePropsToStore = (
  store: Store<KeisenState<ChartDataState>>,
  timezone: KlineTimezone | undefined,
): void => {
  if (timezone === undefined) return;

  const current = store.getState().config;
  if (current.timezone === timezone) return;

  const resolved = resolveTimezone(timezone);
  store.setState((prev) => ({
    ...prev,
    config: {
      ...prev.config,
      timezone,
      resolvedTimezone: resolved,
    },
  }));
};
