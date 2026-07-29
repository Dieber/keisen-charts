import type { ThemeDefinition } from "../types";

/** Neon 示例皮肤：可 registerTheme 或 theme={neonTheme} */
export const neonTheme: ThemeDefinition = {
  id: "neon",
  modes: {
    dark: {
      background: "#0a0a12",
      grid: "#2a1a4a",
      axisTick: "#7b5ea7",
      axisText: "#e0b0ff",
      crosshair: "#c77dff",
      crosshairLabelBg: "#7b2cbf",
      crosshairLabelText: "#ffffff",
      up: "#39FF14",
      down: "#FF10F0",
      accent: "#00e5ff",
    },
    light: {
      background: "#f5f0ff",
      grid: "#d4c4f0",
      axisTick: "#8b6bb5",
      axisText: "#2d1b4e",
      crosshair: "#9b59b6",
      crosshairLabelBg: "#7b2cbf",
      crosshairLabelText: "#ffffff",
      up: "#00c853",
      down: "#d500f9",
      accent: "#00bcd4",
    },
  },
};
