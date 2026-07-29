/** 首期运行时真正处理的子集 */
export type KlineTimezonePreset = "local" | "UTC";

/** 对外类型：预留 IANA，未知值 resolve 时回退并 warning */
export type KlineTimezone = KlineTimezonePreset | (string & {});

export type DateTimeParts = {
  year: number;
  /** 0–11，与 Date 对齐 */
  month: number;
  /** 1–31 */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0=Sun … 6=Sat */
  weekday: number;
};

export type ResolvedTimezoneConfig = {
  timezone: KlineTimezonePreset;
};
