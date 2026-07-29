import type {
  BuiltinIndicatorMeta,
  IndicatorGroupMeta,
  IndicatorParamField,
  IndicatorSettings,
} from "./types";

export const BUILTIN_INDICATOR_METAS: BuiltinIndicatorMeta[] = [
  {
    id: "ma",
    label: "MA",
    group: "main",
    colorLabels: { ma5: "MA5", ma10: "MA10", ma20: "MA20" },
    paramFields: [
      {
        key: "periods",
        label: "均线",
        kind: "periodList",
        colorKeyPrefix: "ma",
        minItems: 1,
        maxItems: 12,
      },
    ],
    defaultSetting: {
      visible: true,
      colors: { ma5: "#2196F3", ma10: "#FF9800", ma20: "#9C27B0" },
      params: { periods: [5, 10, 20] },
    },
  },
  {
    id: "ema",
    label: "EMA",
    group: "main",
    colorLabels: { ema: "EMA" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: true,
      colors: { ema: "#E91E63" },
      params: { period: 12 },
    },
  },
  {
    id: "smma",
    label: "SMMA",
    group: "main",
    colorLabels: { smma: "SMMA" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: true,
      colors: { smma: "#00BCD4" },
      params: { period: 14 },
    },
  },
  {
    id: "boll",
    label: "BOLL",
    group: "main",
    colorLabels: { upper: "上轨", middle: "中轨", lower: "下轨" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
      { key: "stdDev", label: "标准差", kind: "number", min: 0.1, step: 0.1 },
    ],
    defaultSetting: {
      visible: true,
      colors: {
        upper: "#FF5722",
        middle: "#9E9E9E",
        lower: "#4CAF50",
      },
      params: { period: 20, stdDev: 2 },
    },
  },
  {
    id: "sar",
    label: "SAR",
    group: "main",
    colorLabels: { sar: "SAR" },
    paramFields: [
      { key: "start", label: "起始%", kind: "number", min: 0.1, step: 0.1 },
      { key: "step", label: "步长%", kind: "number", min: 0.1, step: 0.1 },
      { key: "max", label: "极限%", kind: "number", min: 0.1, step: 0.1 },
    ],
    defaultSetting: {
      visible: true,
      colors: { sar: "#FFEB3B" },
      params: { start: 2, step: 2, max: 20 },
    },
  },
  {
    id: "volume",
    label: "成交量",
    group: "pane",
    colorLabels: { ma5: "MA5", ma10: "MA10", ma20: "MA20" },
    paramFields: [
      {
        key: "maPeriods",
        label: "均线",
        kind: "periodList",
        colorKeyPrefix: "ma",
        minItems: 0,
        maxItems: 12,
      },
    ],
    defaultSetting: {
      visible: true,
      colors: { ma5: "#2196F3", ma10: "#FF9800", ma20: "#9C27B0" },
      params: { maPeriods: [5, 10, 20] },
    },
  },
  {
    id: "macd",
    label: "MACD",
    group: "pane",
    colorLabels: { dif: "DIF", dea: "DEA", up: "涨柱", down: "跌柱" },
    paramFields: [
      { key: "fastPeriod", label: "快线", kind: "number", min: 1, step: 1 },
      { key: "slowPeriod", label: "慢线", kind: "number", min: 1, step: 1 },
      { key: "signalPeriod", label: "信号", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: true,
      colors: {
        dif: "#2196F3",
        dea: "#FF9800",
        up: "#26a69a",
        down: "#ef5350",
      },
      params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    },
  },
  {
    id: "rsi",
    label: "RSI",
    group: "pane",
    colorLabels: { rsi6: "RSI6", rsi12: "RSI12", rsi24: "RSI24" },
    paramFields: [
      {
        key: "periods",
        label: "周期",
        kind: "periodList",
        colorKeyPrefix: "rsi",
        minItems: 1,
        maxItems: 8,
      },
    ],
    defaultSetting: {
      visible: false,
      colors: { rsi6: "#ff6b6b", rsi12: "#4dabf7", rsi24: "#69db7c" },
      params: { periods: [6, 12, 24] },
    },
  },
  {
    id: "kdj",
    label: "KDJ",
    group: "pane",
    colorLabels: { k: "K", d: "D", j: "J" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
      { key: "kPeriod", label: "K", kind: "number", min: 1, step: 1 },
      { key: "dPeriod", label: "D", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: { k: "#ff6b6b", d: "#4dabf7", j: "#69db7c" },
      params: { period: 9, kPeriod: 3, dPeriod: 3 },
    },
  },
  {
    id: "obv",
    label: "OBV",
    group: "pane",
    colorLabels: { obv: "OBV", maobv: "MAOBV" },
    paramFields: [
      { key: "maPeriod", label: "MA周期", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: { obv: "#4dabf7", maobv: "#ff922b" },
      params: { maPeriod: 30 },
    },
  },
  {
    id: "cci",
    label: "CCI",
    group: "pane",
    colorLabels: { cci: "CCI" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: { cci: "#ffa94d" },
      params: { period: 14 },
    },
  },
  {
    id: "wr",
    label: "WR",
    group: "pane",
    colorLabels: { wr: "WR" },
    paramFields: [
      { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: { wr: "#69db7c" },
      params: { period: 14 },
    },
  },
  {
    id: "dmi",
    label: "DMI",
    group: "pane",
    colorLabels: { pdi: "PDI", mdi: "MDI", adx: "ADX", adxr: "ADXR" },
    paramFields: [
      { key: "n", label: "N", kind: "number", min: 1, step: 1 },
      { key: "mm", label: "MM", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: {
        pdi: "#ff6b6b",
        mdi: "#4dabf7",
        adx: "#fcc419",
        adxr: "#ae3ec9",
      },
      params: { n: 14, mm: 6 },
    },
  },
  {
    id: "mtm",
    label: "MTM",
    group: "pane",
    colorLabels: { mtm: "MTM", mamtm: "MAMTM" },
    paramFields: [
      { key: "n", label: "N", kind: "number", min: 1, step: 1 },
      { key: "m", label: "M", kind: "number", min: 1, step: 1 },
    ],
    defaultSetting: {
      visible: false,
      colors: { mtm: "#4dabf7", mamtm: "#ff922b" },
      params: { n: 12, m: 6 },
    },
  },
];

const MAIN_GROUP_TITLE = "主图指标";
const PANE_GROUP_TITLE = "副图指标";

const cloneParamFields = (
  fields?: IndicatorParamField[],
): IndicatorParamField[] | undefined =>
  fields?.map((field) => ({ ...field }));

const cloneParams = (
  params?: Record<string, number | number[]>,
): Record<string, number | number[]> | undefined => {
  if (!params) return undefined;
  const next: Record<string, number | number[]> = {};
  for (const [key, value] of Object.entries(params)) {
    next[key] = Array.isArray(value) ? [...value] : value;
  }
  return next;
};

export const getBuiltinIndicatorMetas = (): BuiltinIndicatorMeta[] =>
  BUILTIN_INDICATOR_METAS.map((meta) => ({
    ...meta,
    colorLabels: { ...meta.colorLabels },
    paramFields: cloneParamFields(meta.paramFields),
    defaultSetting: {
      visible: meta.defaultSetting.visible,
      colors: { ...meta.defaultSetting.colors },
      ...(meta.defaultSetting.params
        ? { params: cloneParams(meta.defaultSetting.params) }
        : {}),
    },
  }));

export const getDefaultIndicatorSettings = (): IndicatorSettings => {
  const settings: IndicatorSettings = {};
  for (const meta of BUILTIN_INDICATOR_METAS) {
    settings[meta.id] = {
      visible: meta.defaultSetting.visible,
      colors: { ...meta.defaultSetting.colors },
      ...(meta.defaultSetting.params
        ? { params: cloneParams(meta.defaultSetting.params) }
        : {}),
    };
  }
  return settings;
};

export const buildIndicatorGroups = (
  metas: Array<{
    id: string;
    label: string;
    group: "main" | "pane";
    colorLabels: Record<string, string>;
    paramFields?: IndicatorParamField[];
  }>,
): IndicatorGroupMeta[] => {
  const main: IndicatorGroupMeta = {
    title: MAIN_GROUP_TITLE,
    indicators: [],
  };
  const pane: IndicatorGroupMeta = {
    title: PANE_GROUP_TITLE,
    indicators: [],
  };

  for (const meta of metas) {
    const item = {
      id: meta.id,
      label: meta.label,
      colorLabels: { ...meta.colorLabels },
      ...(meta.paramFields
        ? { paramFields: cloneParamFields(meta.paramFields) }
        : {}),
    };
    if (meta.group === "main") main.indicators.push(item);
    else pane.indicators.push(item);
  }

  return [main, pane].filter((group) => group.indicators.length > 0);
};
