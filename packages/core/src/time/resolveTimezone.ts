import type {
  KlineTimezone,
  KlineTimezonePreset,
  ResolvedTimezoneConfig,
} from "./types";

export const DEFAULT_TIMEZONE: KlineTimezonePreset = "local";

const isTimezonePreset = (value: string): value is KlineTimezonePreset =>
  value === "local" || value === "UTC";

/** 校验 + 默认；未知 string 回退 local 并 warning */
export const resolveTimezone = (
  input: KlineTimezone | undefined = undefined,
): ResolvedTimezoneConfig => {
  if (input === undefined) {
    return { timezone: DEFAULT_TIMEZONE };
  }

  if (isTimezonePreset(input)) {
    return { timezone: input };
  }

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(
      `[keisen] Unknown timezone "${input}", falling back to "local". IANA timezones are not supported yet.`,
    );
  }

  return { timezone: DEFAULT_TIMEZONE };
};
