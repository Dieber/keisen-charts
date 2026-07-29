import type {
  CrosshairStyle,
  GridStyle,
} from "../renderer/shared/layers/types";
import type { ResolvedThemeTokens } from "./types";

export const gridStyleFromTheme = (
  theme: ResolvedThemeTokens,
): GridStyle => ({
  color: theme.grid,
});

export const crosshairStyleFromTheme = (
  theme: ResolvedThemeTokens,
): CrosshairStyle => ({
  color: theme.crosshair,
});

export type AxisStyle = {
  tickColor: string;
  textColor: string;
  accent?: string;
};

export const axisStyleFromTheme = (
  theme: ResolvedThemeTokens,
): AxisStyle => ({
  tickColor: theme.axisTick,
  textColor: theme.axisText,
  accent: theme.accent,
});

/** 非透明背景时在 clearRect 后填充 */
export const fillThemeBackground = (
  ctx: CanvasRenderingContext2D,
  theme: ResolvedThemeTokens,
  width: number,
  height: number,
): void => {
  if (!theme.background || theme.background === "transparent") return;
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);
};
