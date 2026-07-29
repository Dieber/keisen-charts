import {
  applyLocaleToStore,
  type LocaleMessages,
} from "@keisen-charts/core";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useKlineStore } from "../context/KeisenStoreContext";

export { applyLocaleToStore };

type LocaleCallbacks = {
  onLocaleChange?: (localeId: string) => void;
};

const LocaleCallbacksContext = createContext<LocaleCallbacks>({});

export const LocaleCallbacksProvider = ({
  children,
  onLocaleChange,
}: LocaleCallbacks & { children: ReactNode }) => (
  <LocaleCallbacksContext.Provider value={{ onLocaleChange }}>
    {children}
  </LocaleCallbacksContext.Provider>
);

export type UseKlineLocaleResult = {
  locale: string;
  setLocale: (localeId: string) => void;
  /** 当前已解析文案表（只读） */
  messages: LocaleMessages;
};

export const useKlineLocale = (): UseKlineLocaleResult => {
  const store = useKlineStore();
  const { onLocaleChange } = useContext(LocaleCallbacksContext);

  const locale = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.localeId, onStoreChange),
    () => store.getState().config.localeId,
    () => store.getState().config.localeId,
  );

  const messages = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => state.config.resolvedLocale,
        onStoreChange,
      ),
    () => store.getState().config.resolvedLocale,
    () => store.getState().config.resolvedLocale,
  );

  const setLocale = useCallback(
    (nextLocaleId: string) => {
      applyLocaleToStore(store, nextLocaleId);
      onLocaleChange?.(store.getState().config.localeId);
    },
    [store, onLocaleChange],
  );

  return {
    locale,
    setLocale,
    messages,
  };
};
