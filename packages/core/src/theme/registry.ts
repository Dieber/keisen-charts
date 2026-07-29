import { defaultTheme } from "./presets/default";
import { neonTheme } from "./presets/neon";
import type { ThemeDefinition } from "./types";

const registry = new Map<string, ThemeDefinition>([
  [defaultTheme.id, defaultTheme],
  [neonTheme.id, neonTheme],
]);

export const registerTheme = (theme: ThemeDefinition): void => {
  registry.set(theme.id, theme);
};

export const getTheme = (id: string): ThemeDefinition => {
  const theme = registry.get(id);
  if (!theme) {
    throw new Error(
      `[keisen] Unknown theme "${id}". Register it with registerTheme() first.`,
    );
  }
  return theme;
};

export const hasTheme = (id: string): boolean => registry.has(id);

export const listThemes = (): ThemeDefinition[] => [...registry.values()];
