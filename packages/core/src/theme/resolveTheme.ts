import { defaultTheme } from "./presets/default";
import { getTheme } from "./registry";
import type {
  ResolvedThemeTokens,
  ThemeDefinition,
  ThemeInput,
  ThemeMode,
  ThemeTokens,
  UpDownScheme,
} from "./types";

const isThemeDefinition = (value: ThemeInput): value is ThemeDefinition =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  "modes" in value &&
  typeof (value as ThemeDefinition).id === "string";

export const applyUpDown = (
  tokens: ThemeTokens,
  upDown: UpDownScheme,
): ResolvedThemeTokens => {
  if (upDown === "green-up") return { ...tokens };
  return { ...tokens, up: tokens.down, down: tokens.up };
};

export type ResolvedThemeConfig = {
  themeId: string;
  themeDefinition: ThemeDefinition;
  themeOverrides?: Partial<ThemeTokens>;
  mode: ThemeMode;
  upDown: UpDownScheme;
  resolvedTheme: ResolvedThemeTokens;
};

const normalizeThemeInput = (
  input: ThemeInput | undefined,
): {
  themeId: string;
  themeDefinition: ThemeDefinition;
  themeOverrides?: Partial<ThemeTokens>;
} => {
  if (input === undefined || input === "default") {
    return { themeId: defaultTheme.id, themeDefinition: defaultTheme };
  }

  if (typeof input === "string") {
    const themeDefinition = getTheme(input);
    return { themeId: themeDefinition.id, themeDefinition };
  }

  if (isThemeDefinition(input)) {
    return { themeId: input.id, themeDefinition: input };
  }

  return {
    themeId: "custom",
    themeDefinition: defaultTheme,
    themeOverrides: input,
  };
};

/** 由 definition + mode + upDown + overrides 计算已解析色板 */
export const computeResolvedTheme = (
  themeDefinition: ThemeDefinition,
  mode: ThemeMode,
  upDown: UpDownScheme,
  themeOverrides?: Partial<ThemeTokens>,
): ResolvedThemeTokens => {
  const base: ThemeTokens = {
    ...themeDefinition.modes[mode],
    ...themeOverrides,
  };
  return applyUpDown(base, upDown);
};

/** 将用户输入解析为完整主题配置片段 */
export const resolveThemeConfig = (
  theme: ThemeInput | undefined = undefined,
  mode: ThemeMode = "dark",
  upDown: UpDownScheme = "green-up",
): ResolvedThemeConfig => {
  const { themeId, themeDefinition, themeOverrides } =
    normalizeThemeInput(theme);
  return {
    themeId,
    themeDefinition,
    themeOverrides,
    mode,
    upDown,
    resolvedTheme: computeResolvedTheme(
      themeDefinition,
      mode,
      upDown,
      themeOverrides,
    ),
  };
};

/** 在已有 config 上仅改 mode / upDown 时重算 */
export const recomputeResolvedTheme = (input: {
  themeDefinition: ThemeDefinition;
  themeOverrides?: Partial<ThemeTokens>;
  mode: ThemeMode;
  upDown: UpDownScheme;
}): ResolvedThemeTokens =>
  computeResolvedTheme(
    input.themeDefinition,
    input.mode,
    input.upDown,
    input.themeOverrides,
  );
