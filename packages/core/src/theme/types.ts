/** 明暗模式 */
export type ThemeMode = "light" | "dark";

/** 涨跌色极性：语义 up/down，非红/绿 */
export type UpDownScheme = "green-up" | "red-up";

/**
 * 某一明暗模式下的完整色板（语义 token）。
 * token 内 up/down 按 green-up（绿涨红跌）书写；红涨绿跌由 resolve 交换。
 */
export type ThemeTokens = {
  background: string;
  grid: string;
  axisTick: string;
  axisText: string;
  crosshair: string;
  crosshairLabelBg: string;
  crosshairLabelText: string;
  up: string;
  down: string;
  accent: string;
  series?: {
    ma?: string[];
    ema?: string;
    smma?: string;
    boll?: { upper?: string; middle?: string; lower?: string };
    sar?: string;
  };
};

/** 已解析色板（已套用 upDown） */
export type ResolvedThemeTokens = ThemeTokens;

export type ThemeDefinition = {
  id: string;
  modes: Record<ThemeMode, ThemeTokens>;
};

/**
 * 用户传入形态：
 * - string：已注册 preset id
 * - ThemeDefinition：整包自定义皮肤
 * - Partial&lt;ThemeTokens&gt;：浅合并到当前 mode 的 default 之上
 */
export type ThemeInput = string | ThemeDefinition | Partial<ThemeTokens>;
