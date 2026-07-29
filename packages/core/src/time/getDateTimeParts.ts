import type { DateTimeParts, KlineTimezonePreset } from "./types";

/** 按展示时区读取日历字段；唯一入口，禁止 Layer 内散落 get* / getUTC* */
export const getDateTimeParts = (
  timestamp: number,
  timezone: KlineTimezonePreset,
): DateTimeParts => {
  const d = new Date(timestamp);
  if (timezone === "UTC") {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
      weekday: d.getUTCDay(),
    };
  }
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
    weekday: d.getDay(),
  };
};
