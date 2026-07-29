import { afterEach, describe, expect, mock, test } from "bun:test";

import { applyLocaleToStore } from "./applyLocaleToStore";
import { enUSLocale } from "./presets/en-US";
import { zhCNLocale } from "./presets/zh-CN";
import {
  getLocale,
  hasLocale,
  listLocales,
  registerLocale,
} from "./registry";
import { DEFAULT_LOCALE_ID, resolveLocale } from "./resolveLocale";
import { createKeisenStore } from "../store/createKeisenStore";

describe("locale registry", () => {
  afterEach(() => {
    registerLocale(zhCNLocale.id, zhCNLocale.messages);
    registerLocale(enUSLocale.id, enUSLocale.messages);
  });

  test("builtins are registered", () => {
    expect(hasLocale("zh-CN")).toBe(true);
    expect(hasLocale("en-US")).toBe(true);
    expect(getLocale("zh-CN").messages.open).toBe("开盘:");
    expect(getLocale("en-US").messages.open).toBe("Open:");
    expect(listLocales().some((l) => l.id === "zh-CN")).toBe(true);
    expect(listLocales().some((l) => l.id === "en-US")).toBe(true);
  });

  test("registerLocale merges partial onto zh-CN defaults", () => {
    registerLocale("zh-HK", {
      open: "開：",
      high: "高：",
      low: "低：",
      close: "收：",
      volume: "量：",
    });

    const locale = getLocale("zh-HK");
    expect(locale.messages.open).toBe("開：");
    expect(locale.messages.high).toBe("高：");
    expect(locale.messages.time).toBe(zhCNLocale.messages.time);
    expect(locale.messages.minute).toBe(zhCNLocale.messages.minute);
  });

  test("getLocale throws for unknown id", () => {
    expect(() => getLocale("no-such-locale")).toThrow(
      /Register it with registerLocale/,
    );
  });
});

describe("resolveLocale", () => {
  afterEach(() => {
    registerLocale(zhCNLocale.id, zhCNLocale.messages);
    registerLocale(enUSLocale.id, enUSLocale.messages);
  });

  test("defaults to zh-CN", () => {
    const resolved = resolveLocale();
    expect(resolved.localeId).toBe(DEFAULT_LOCALE_ID);
    expect(resolved.resolvedLocale.open).toBe("开盘:");
  });

  test("resolves registered locale", () => {
    const resolved = resolveLocale("en-US");
    expect(resolved.localeId).toBe("en-US");
    expect(resolved.resolvedLocale.volume).toBe("Volume:");
  });

  test("unknown id falls back with warning", () => {
    const warn = mock(() => {});
    const original = console.warn;
    console.warn = warn;
    try {
      const resolved = resolveLocale("xx-YY");
      expect(resolved.localeId).toBe("zh-CN");
      expect(resolved.resolvedLocale.open).toBe("开盘:");
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      console.warn = original;
    }
  });
});

describe("applyLocaleToStore", () => {
  test("writes localeId and resolvedLocale", () => {
    const store = createKeisenStore();
    applyLocaleToStore(store, "en-US");
    const { localeId, resolvedLocale } = store.getState().config;
    expect(localeId).toBe("en-US");
    expect(resolvedLocale.open).toBe("Open:");
  });

  test("undefined is a no-op", () => {
    const store = createKeisenStore();
    const before = store.getState().config.localeId;
    applyLocaleToStore(store, undefined);
    expect(store.getState().config.localeId).toBe(before);
  });
});
