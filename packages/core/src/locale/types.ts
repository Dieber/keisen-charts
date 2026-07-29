/** 图表内置可见文案；key 稳定，值可按语言覆盖 */
export type LocaleMessages = {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  second: string;
  minute: string;
  hour: string;
  day: string;
  week: string;
  month: string;
  year: string;
};

export type LocaleDefinition = {
  id: string;
  messages: LocaleMessages;
};
