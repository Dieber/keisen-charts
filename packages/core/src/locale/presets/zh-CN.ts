import type { LocaleDefinition } from "../types";

/** 默认中文包；与改造前 DataPanel 硬编码文案一致 */
export const zhCNLocale: LocaleDefinition = {
  id: "zh-CN",
  messages: {
    time: "时间:",
    open: "开盘:",
    high: "最高:",
    low: "最低:",
    close: "收盘:",
    volume: "成交量:",
    second: "秒",
    minute: "分钟",
    hour: "小时",
    day: "天",
    week: "周",
    month: "月",
    year: "年",
  },
};
