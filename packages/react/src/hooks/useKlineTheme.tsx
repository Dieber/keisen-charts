import {
  applyThemePropsToStore,
  recomputeResolvedTheme,
  type ResolvedThemeTokens,
  type ThemeInput,
  type ThemeMode,
  type UpDownScheme,
} from "@keisen-charts/core";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useKlineStore } from "../context/KeisenStoreContext";

export { applyThemePropsToStore };

type ThemeCallbacks = {
  onThemeChange?: (theme: ThemeInput) => void;
  onModeChange?: (mode: ThemeMode) => void;
  onUpDownChange?: (scheme: UpDownScheme) => void;
};

const ThemeCallbacksContext = createContext<ThemeCallbacks>({});

export const ThemeCallbacksProvider = ({
  children,
  onThemeChange,
  onModeChange,
  onUpDownChange,
}: ThemeCallbacks & { children: ReactNode }) => (
  <ThemeCallbacksContext.Provider
    value={{ onThemeChange, onModeChange, onUpDownChange }}
  >
    {children}
  </ThemeCallbacksContext.Provider>
);

export type UseKlineThemeResult = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  upDown: UpDownScheme;
  setUpDown: (scheme: UpDownScheme) => void;
  themeId: string;
  setTheme: (theme: ThemeInput) => void;
  /** 当前已解析色板（只读） */
  colors: ResolvedThemeTokens;
};

export const useKlineTheme = (): UseKlineThemeResult => {
  const store = useKlineStore();
  const { onThemeChange, onModeChange, onUpDownChange } =
    useContext(ThemeCallbacksContext);

  const mode = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.mode, onStoreChange),
    () => store.getState().config.mode,
    () => store.getState().config.mode,
  );

  const upDown = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.upDown, onStoreChange),
    () => store.getState().config.upDown,
    () => store.getState().config.upDown,
  );

  const themeId = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice((state) => state.config.themeId, onStoreChange),
    () => store.getState().config.themeId,
    () => store.getState().config.themeId,
  );

  const colors = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => state.config.resolvedTheme,
        onStoreChange,
      ),
    () => store.getState().config.resolvedTheme,
    () => store.getState().config.resolvedTheme,
  );

  const setTheme = useCallback(
    (nextTheme: ThemeInput) => {
      applyThemePropsToStore(store, nextTheme, undefined, undefined);
      onThemeChange?.(nextTheme);
    },
    [store, onThemeChange],
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      store.setState((prev) => {
        if (prev.config.mode === nextMode) return prev;
        return {
          ...prev,
          config: {
            ...prev.config,
            mode: nextMode,
            resolvedTheme: recomputeResolvedTheme({
              themeDefinition: prev.config.themeDefinition,
              themeOverrides: prev.config.themeOverrides,
              mode: nextMode,
              upDown: prev.config.upDown,
            }),
          },
        };
      });
      onModeChange?.(nextMode);
    },
    [store, onModeChange],
  );

  const setUpDown = useCallback(
    (nextUpDown: UpDownScheme) => {
      store.setState((prev) => {
        if (prev.config.upDown === nextUpDown) return prev;
        return {
          ...prev,
          config: {
            ...prev.config,
            upDown: nextUpDown,
            resolvedTheme: recomputeResolvedTheme({
              themeDefinition: prev.config.themeDefinition,
              themeOverrides: prev.config.themeOverrides,
              mode: prev.config.mode,
              upDown: nextUpDown,
            }),
          },
        };
      });
      onUpDownChange?.(nextUpDown);
    },
    [store, onUpDownChange],
  );

  return {
    mode,
    setMode,
    upDown,
    setUpDown,
    themeId,
    setTheme,
    colors,
  };
};
