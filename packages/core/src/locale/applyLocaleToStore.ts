import type { KeisenState, Store } from "../store/Store";
import type { ChartDataState } from "../types/kline";
import { resolveLocale } from "./resolveLocale";

/** 将 locale id 写入 store（未知 id 由 resolveLocale 回退） */
export const applyLocaleToStore = (
  store: Store<KeisenState<ChartDataState>>,
  localeId: string | undefined,
): void => {
  if (localeId === undefined) return;

  const resolved = resolveLocale(localeId);
  const current = store.getState().config;
  if (current.localeId === resolved.localeId) return;

  store.setState((prev) => ({
    ...prev,
    config: {
      ...prev.config,
      localeId: resolved.localeId,
      resolvedLocale: resolved.resolvedLocale,
    },
  }));
};
