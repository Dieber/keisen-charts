import { hasLocale, getLocale } from "./registry";
import { zhCNLocale } from "./presets/zh-CN";
import type { LocaleMessages } from "./types";

export const DEFAULT_LOCALE_ID = zhCNLocale.id;

export type ResolvedLocaleConfig = {
  localeId: string;
  resolvedLocale: LocaleMessages;
};

/** 未知 id → 回退 zh-CN + warning，不打断渲染 */
export const resolveLocale = (
  localeId: string | undefined = undefined,
): ResolvedLocaleConfig => {
  if (localeId === undefined || localeId === DEFAULT_LOCALE_ID) {
    return {
      localeId: DEFAULT_LOCALE_ID,
      resolvedLocale: { ...zhCNLocale.messages },
    };
  }

  if (hasLocale(localeId)) {
    const locale = getLocale(localeId);
    return {
      localeId: locale.id,
      resolvedLocale: { ...locale.messages },
    };
  }

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(
      `[keisen] Unknown locale "${localeId}", falling back to "${DEFAULT_LOCALE_ID}". Register it with registerLocale() first.`,
    );
  }

  return {
    localeId: DEFAULT_LOCALE_ID,
    resolvedLocale: { ...zhCNLocale.messages },
  };
};
