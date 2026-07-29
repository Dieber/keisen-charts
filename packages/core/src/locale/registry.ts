import { enUSLocale } from "./presets/en-US";
import { zhCNLocale } from "./presets/zh-CN";
import type { LocaleDefinition, LocaleMessages } from "./types";

const registry = new Map<string, LocaleDefinition>([
  [zhCNLocale.id, zhCNLocale],
  [enUSLocale.id, enUSLocale],
]);

/** 未传的 key 回落到 zh-CN 默认 */
export const mergeLocaleMessages = (
  partial: Partial<LocaleMessages>,
): LocaleMessages => ({
  ...zhCNLocale.messages,
  ...partial,
});

export const registerLocale = (
  id: string,
  messages: Partial<LocaleMessages>,
): void => {
  registry.set(id, {
    id,
    messages: mergeLocaleMessages(messages),
  });
};

export const getLocale = (id: string): LocaleDefinition => {
  const locale = registry.get(id);
  if (!locale) {
    throw new Error(
      `[keisen] Unknown locale "${id}". Register it with registerLocale() first.`,
    );
  }
  return locale;
};

export const hasLocale = (id: string): boolean => registry.has(id);

export const listLocales = (): LocaleDefinition[] => [...registry.values()];
