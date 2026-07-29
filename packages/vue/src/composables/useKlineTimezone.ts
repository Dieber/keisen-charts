import {
  applyTimezonePropsToStore,
  resolveTimezone,
  type KlineTimezone,
} from "@keisen-charts/core";
import { inject, type DeepReadonly, type Ref } from "vue";

import { timezoneCallbacksKey } from "../context/keys";
import { useKlineStore } from "../context/useKlineStore";
import { useStoreSlice } from "./useStoreSlice";

export { applyTimezonePropsToStore };

export type UseKlineTimezoneResult = {
  timezone: DeepReadonly<Ref<KlineTimezone>>;
  setTimezone: (timezone: KlineTimezone) => void;
};

export const useKlineTimezone = (): UseKlineTimezoneResult => {
  const store = useKlineStore();
  const callbacks = inject(timezoneCallbacksKey, {});

  const timezone = useStoreSlice(store, (state) => state.config.timezone);

  const setTimezone = (nextTimezone: KlineTimezone) => {
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
    callbacks.onTimezoneChange?.(nextTimezone);
  };

  return {
    timezone,
    setTimezone,
  };
};
