import type { KeisenState, Store } from "../store/Store";
import type { ChartDataState } from "../types/kline";
import type { ThemeInput, ThemeMode, UpDownScheme } from "./types";
import { resolveThemeConfig } from "./resolveTheme";

/** 将 theme / mode / upDown props 写入 store */
export const applyThemePropsToStore = (
  store: Store<KeisenState<ChartDataState>>,
  theme: ThemeInput | undefined,
  mode: ThemeMode | undefined,
  upDown: UpDownScheme | undefined,
): void => {
  const current = store.getState().config;
  const resolved = resolveThemeConfig(
    theme,
    mode ?? current.mode,
    upDown ?? current.upDown,
  );

  store.setState((prev) => ({
    ...prev,
    config: {
      ...prev.config,
      themeId: resolved.themeId,
      themeDefinition: resolved.themeDefinition,
      themeOverrides: resolved.themeOverrides,
      mode: resolved.mode,
      upDown: resolved.upDown,
      resolvedTheme: resolved.resolvedTheme,
    },
  }));
};
