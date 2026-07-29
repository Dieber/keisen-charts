import {
  applyTimezonePropsToStore,
  resolveTimezone,
  type KlineTimezone,
} from "@keisen-charts/core";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useKlineStore } from "../context/KeisenStoreContext";

export { applyTimezonePropsToStore };

type TimezoneCallbacks = {
  onTimezoneChange?: (timezone: KlineTimezone) => void;
};

const TimezoneCallbacksContext = createContext<TimezoneCallbacks>({});

export const TimezoneCallbacksProvider = ({
  children,
  onTimezoneChange,
}: TimezoneCallbacks & { children: ReactNode }) => (
  <TimezoneCallbacksContext.Provider value={{ onTimezoneChange }}>
    {children}
  </TimezoneCallbacksContext.Provider>
);

export type UseKlineTimezoneResult = {
  timezone: KlineTimezone;
  setTimezone: (timezone: KlineTimezone) => void;
};

export const useKlineTimezone = (): UseKlineTimezoneResult => {
  const store = useKlineStore();
  const { onTimezoneChange } = useContext(TimezoneCallbacksContext);

  const timezone = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.timezone, onStoreChange),
    () => store.getState().config.timezone,
    () => store.getState().config.timezone,
  );

  const setTimezone = useCallback(
    (nextTimezone: KlineTimezone) => {
      store.setState((prev) => {
        if (prev.config.timezone === nextTimezone) return prev;
        const resolved = resolveTimezone(nextTimezone);
        return {
          ...prev,
          config: {
            ...prev.config,
            timezone: nextTimezone,
            resolvedTimezone: resolved,
          },
        };
      });
      onTimezoneChange?.(nextTimezone);
    },
    [store, onTimezoneChange],
  );

  return {
    timezone,
    setTimezone,
  };
};
