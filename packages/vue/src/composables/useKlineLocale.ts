import {
  applyLocaleToStore,
  type LocaleMessages,
} from "@keisen-charts/core";
import { inject, type DeepReadonly, type Ref } from "vue";

import { localeCallbacksKey } from "../context/keys";
import { useKlineStore } from "../context/useKlineStore";
import { useStoreSlice } from "./useStoreSlice";

export { applyLocaleToStore };

export type UseKlineLocaleResult = {
  locale: DeepReadonly<Ref<string>>;
  setLocale: (localeId: string) => void;
  messages: DeepReadonly<Ref<LocaleMessages>>;
};

export const useKlineLocale = (): UseKlineLocaleResult => {
  const store = useKlineStore();
  const callbacks = inject(localeCallbacksKey, {});

  const locale = useStoreSlice(store, (state) => state.config.localeId);
  const messages = useStoreSlice(store, (state) => state.config.resolvedLocale);

  const setLocale = (nextLocaleId: string) => {
    applyLocaleToStore(store, nextLocaleId);
    callbacks.onLocaleChange?.(store.getState().config.localeId);
  };

  return {
    locale,
    setLocale,
    messages,
  };
};
