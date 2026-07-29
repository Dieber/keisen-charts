import type {
  IndicatorMetaItem,
  IndicatorParamField,
  IndicatorSetting,
} from "./types";

/** 周期 / 均线默认色板（与 maColorsForPeriods 共用） */
export const PERIOD_PALETTE = [
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#4CAF50",
  "#E91E63",
  "#00BCD4",
  "#FFEB3B",
  "#795548",
  "#607D8B",
  "#FF5722",
  "#3F51B5",
  "#009688",
] as const;

export const paletteColorAt = (index: number): string =>
  PERIOD_PALETTE[index % PERIOD_PALETTE.length]!;

export const normalizeHex = (raw: string): string | null => {
  const value = raw.trim();
  const withHash = value.startsWith("#") ? value : `#${value}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
};

export const toColorInputValue = (raw: string): string =>
  normalizeHex(raw) ?? "#888888";

export const readNumberParam = (
  setting: IndicatorSetting,
  key: string,
  fallback = 1,
): number => {
  const value = setting.params?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

export const readPeriods = (
  setting: IndicatorSetting,
  key: string,
): number[] => {
  const value = setting.params?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (n) => typeof n === "number" && Number.isFinite(n) && n > 0,
  );
};

export const patchParams = (
  setting: IndicatorSetting,
  patch: Record<string, number | number[]>,
): Record<string, number | number[]> => ({
  ...(setting.params ?? {}),
  ...patch,
});

export type PeriodListField = Extract<
  IndicatorParamField,
  { kind: "periodList" }
>;

export type NumberParamField = Extract<IndicatorParamField, { kind: "number" }>;

export type PartitionedIndicatorParamFields = {
  periodListField?: PeriodListField;
  numberFields: NumberParamField[];
  /** periodList 模式下静态色键为空；否则为 colorLabels 条目 */
  staticColorEntries: Array<[string, string]>;
};

export const partitionIndicatorParamFields = (
  indicator: Pick<IndicatorMetaItem, "paramFields" | "colorLabels">,
): PartitionedIndicatorParamFields => {
  const paramFields = indicator.paramFields ?? [];
  const periodListField = paramFields.find(
    (field): field is PeriodListField => field.kind === "periodList",
  );
  const numberFields = paramFields.filter(
    (field): field is NumberParamField => field.kind === "number",
  );
  const staticColorEntries = periodListField
    ? []
    : Object.entries(indicator.colorLabels);

  return { periodListField, numberFields, staticColorEntries };
};

/** periodList 追加步进：ma 前缀 +10，其余 +6 */
export const nextPeriodListStep = (colorKeyPrefix: string): number =>
  colorKeyPrefix === "ma" ? 10 : 6;

export type UpdatePeriodListAtResult = {
  nextPeriods: number[];
  /** 需写入的颜色（周期键迁移） */
  nextColors: Record<string, string>;
} | null;

export const updatePeriodListAt = (
  periods: number[],
  setting: IndicatorSetting,
  field: PeriodListField,
  index: number,
  raw: string,
): UpdatePeriodListAtResult => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const period = Math.round(parsed);
  const prev = periods[index];
  if (prev === undefined || prev === period) return null;
  if (periods.some((p, i) => i !== index && p === period)) return null;

  const nextPeriods = [...periods];
  nextPeriods[index] = period;
  const prevKey = `${field.colorKeyPrefix}${prev}`;
  const nextKey = `${field.colorKeyPrefix}${period}`;
  const migrated =
    setting.colors[prevKey] ?? paletteColorAt(index);
  return { nextPeriods, nextColors: { [nextKey]: migrated } };
};

export const removePeriodListAt = (
  periods: number[],
  index: number,
  minItems: number,
): number[] | null => {
  if (periods.length <= minItems) return null;
  return periods.filter((_, i) => i !== index);
};

export type AppendPeriodListResult = {
  nextPeriods: number[];
  nextColors: Record<string, string>;
} | null;

export const appendPeriodList = (
  periods: number[],
  setting: IndicatorSetting,
  field: PeriodListField,
  maxItems: number,
): AppendPeriodListResult => {
  if (periods.length >= maxItems) return null;
  const nextPeriod =
    (periods.length > 0 ? Math.max(...periods) : 0) +
    nextPeriodListStep(field.colorKeyPrefix);
  let period = nextPeriod;
  while (periods.includes(period)) period += 1;
  const colorKey = `${field.colorKeyPrefix}${period}`;
  const color =
    setting.colors[colorKey] ?? paletteColorAt(periods.length);
  return {
    nextPeriods: [...periods, period],
    nextColors: { [colorKey]: color },
  };
};
