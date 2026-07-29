import type { ThemeDefinition } from "../types";

/** 默认皮肤：观感对齐改造前 TradingView 风暗色硬编码 */
export const defaultTheme: ThemeDefinition = {
  id: "default",
  modes: {
    dark: {
      background: "transparent",
      grid: "#bbbbbb",
      axisTick: "#787B86",
      axisText: "#D1D4DC",
      crosshair: "#758696",
      crosshairLabelBg: "#2962FF",
      crosshairLabelText: "#FFFFFF",
      up: "#26A69A",
      down: "#EF5350",
      accent: "#2962FF",
    },
    light: {
      background: "transparent",
      grid: "#e0e3eb",
      axisTick: "#9598a1",
      axisText: "#131722",
      crosshair: "#9598a1",
      crosshairLabelBg: "#2962FF",
      crosshairLabelText: "#FFFFFF",
      up: "#089981",
      down: "#F23645",
      accent: "#2962FF",
    },
  },
};
