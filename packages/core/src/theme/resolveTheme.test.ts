import { describe, expect, test } from "bun:test";

import { defaultTheme } from "./presets/default";
import { neonTheme } from "./presets/neon";
import { applyUpDown, resolveThemeConfig } from "./resolveTheme";

describe("resolveThemeConfig", () => {
  test("defaults to default/dark/green-up", () => {
    const resolved = resolveThemeConfig();
    expect(resolved.themeId).toBe("default");
    expect(resolved.mode).toBe("dark");
    expect(resolved.upDown).toBe("green-up");
    expect(resolved.resolvedTheme.up).toBe(defaultTheme.modes.dark.up);
    expect(resolved.resolvedTheme.down).toBe(defaultTheme.modes.dark.down);
  });

  test("red-up swaps up/down", () => {
    const resolved = resolveThemeConfig("default", "dark", "red-up");
    expect(resolved.resolvedTheme.up).toBe(defaultTheme.modes.dark.down);
    expect(resolved.resolvedTheme.down).toBe(defaultTheme.modes.dark.up);
  });

  test("neon preset resolves", () => {
    const resolved = resolveThemeConfig("neon", "dark", "green-up");
    expect(resolved.themeId).toBe("neon");
    expect(resolved.resolvedTheme.up).toBe(neonTheme.modes.dark.up);
  });

  test("partial tokens merge onto mode", () => {
    const resolved = resolveThemeConfig({ grid: "#111" }, "light", "green-up");
    expect(resolved.themeId).toBe("custom");
    expect(resolved.resolvedTheme.grid).toBe("#111");
    expect(resolved.resolvedTheme.axisText).toBe(
      defaultTheme.modes.light.axisText,
    );
  });
});

describe("applyUpDown", () => {
  test("green-up keeps colors", () => {
    const tokens = defaultTheme.modes.dark;
    expect(applyUpDown(tokens, "green-up").up).toBe(tokens.up);
  });
});
