import {
  applyThemePropsToStore,
  recomputeResolvedTheme,
  type ResolvedThemeTokens,
  type ThemeInput,
  type ThemeMode,
  type UpDownScheme,
} from "@keisen-charts/core";
import { inject, type DeepReadonly, type Ref } from "vue";

import { themeCallbacksKey } from "../context/keys";
import { useKlineStore } from "../context/useKlineStore";
import { useStoreSlice } from "./useStoreSlice";

export { applyThemePropsToStore };

export type UseKlineThemeResult = {
  mode: DeepReadonly<Ref<ThemeMode>>;
  setMode: (mode: ThemeMode) => void;
  upDown: DeepReadonly<Ref<UpDownScheme>>;
  setUpDown: (scheme: UpDownScheme) => void;
  themeId: DeepReadonly<Ref<string>>;
  setTheme: (theme: ThemeInput) => void;
  colors: DeepReadonly<Ref<ResolvedThemeTokens>>;
};

export const useKlineTheme = (): UseKlineThemeResult => {
  const store = useKlineStore();
  const callbacks = inject(themeCallbacksKey, {});

  const mode = useStoreSlice(store, (state) => state.config.mode);
  const upDown = useStoreSlice(store, (state) => state.config.upDown);
  const themeId = useStoreSlice(store, (state) => state.config.themeId);
  const colors = useStoreSlice(store, (state) => state.config.resolvedTheme);

  const setTheme = (nextTheme: ThemeInput) => {
    applyThemePropsToStore(store, nextTheme, undefined, undefined);
    callbacks.onThemeChange?.(nextTheme);
  };

  const setMode = (nextMode: ThemeMode) => {
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
    callbacks.onModeChange?.(nextMode);
  };

  const setUpDown = (nextUpDown: UpDownScheme) => {
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
    callbacks.onUpDownChange?.(nextUpDown);
  };

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
