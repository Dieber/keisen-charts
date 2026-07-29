import type {
  IndicatorComposePlan,
  IndicatorExtraMeta,
  IndicatorSetting,
  IndicatorSettings,
  MainLayerSpec,
  PaneChartSpec,
} from "./types";

export const DEFAULT_MA_PERIODS = [5, 10, 20] as const;

export type ResolveComposePlanOptions = {
  maPeriods?: number[];
  extras?: IndicatorExtraMeta[];
};

const color = (
  settings: IndicatorSettings,
  id: string,
  key: string,
  fallback = "#888888",
): string => settings[id]?.colors[key] ?? fallback;

const numParam = (
  setting: IndicatorSetting | undefined,
  key: string,
  fallback: number,
): number => {
  const value = setting?.params?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const arrParam = (
  setting: IndicatorSetting | undefined,
  key: string,
  fallback: number[],
): number[] => {
  const value = setting?.params?.[key];
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0);
};

export const resolveIndicatorComposePlan = (
  settings: IndicatorSettings,
  options: ResolveComposePlanOptions = {},
): IndicatorComposePlan => {
  const fallbackMaPeriods = options.maPeriods ?? [...DEFAULT_MA_PERIODS];
  const mainLayers: MainLayerSpec[] = [];
  const paneCharts: PaneChartSpec[] = [];

  if (settings.ma?.visible) {
    const periods = arrParam(settings.ma, "periods", fallbackMaPeriods);
    mainLayers.push({
      kind: "ma",
      periods: periods.length > 0 ? periods : [...fallbackMaPeriods],
      colors: { ...settings.ma.colors },
    });
  }
  if (settings.ema?.visible) {
    mainLayers.push({
      kind: "ema",
      period: numParam(settings.ema, "period", 12),
      color: color(settings, "ema", "ema", "#E91E63"),
    });
  }
  if (settings.smma?.visible) {
    mainLayers.push({
      kind: "smma",
      period: numParam(settings.smma, "period", 14),
      color: color(settings, "smma", "smma", "#00BCD4"),
    });
  }
  if (settings.boll?.visible) {
    mainLayers.push({
      kind: "boll",
      period: numParam(settings.boll, "period", 20),
      stdDev: numParam(settings.boll, "stdDev", 2),
      colors: {
        upper: color(settings, "boll", "upper", "#FF5722"),
        middle: color(settings, "boll", "middle", "#9E9E9E"),
        lower: color(settings, "boll", "lower", "#4CAF50"),
      },
    });
  }
  if (settings.sar?.visible) {
    mainLayers.push({
      kind: "sar",
      start: numParam(settings.sar, "start", 2),
      step: numParam(settings.sar, "step", 2),
      max: numParam(settings.sar, "max", 20),
      color: color(settings, "sar", "sar", "#FFEB3B"),
    });
  }

  if (settings.volume?.visible) {
    paneCharts.push({
      kind: "volume",
      maPeriods: arrParam(settings.volume, "maPeriods", [5, 10, 20]),
      colors: { ...settings.volume.colors },
    });
  }
  if (settings.macd?.visible) {
    paneCharts.push({
      kind: "macd",
      fastPeriod: numParam(settings.macd, "fastPeriod", 12),
      slowPeriod: numParam(settings.macd, "slowPeriod", 26),
      signalPeriod: numParam(settings.macd, "signalPeriod", 9),
      colors: {
        dif: color(settings, "macd", "dif", "#2196F3"),
        dea: color(settings, "macd", "dea", "#FF9800"),
        up: color(settings, "macd", "up", "#26a69a"),
        down: color(settings, "macd", "down", "#ef5350"),
      },
    });
  }
  if (settings.rsi?.visible) {
    paneCharts.push({
      kind: "rsi",
      periods: arrParam(settings.rsi, "periods", [6, 12, 24]),
      colors: { ...settings.rsi.colors },
    });
  }
  if (settings.kdj?.visible) {
    paneCharts.push({
      kind: "kdj",
      period: numParam(settings.kdj, "period", 9),
      kPeriod: numParam(settings.kdj, "kPeriod", 3),
      dPeriod: numParam(settings.kdj, "dPeriod", 3),
      colors: {
        k: color(settings, "kdj", "k", "#ff6b6b"),
        d: color(settings, "kdj", "d", "#4dabf7"),
        j: color(settings, "kdj", "j", "#69db7c"),
      },
    });
  }
  if (settings.obv?.visible) {
    paneCharts.push({
      kind: "obv",
      maPeriod: numParam(settings.obv, "maPeriod", 30),
      colors: {
        obv: color(settings, "obv", "obv", "#4dabf7"),
        maobv: color(settings, "obv", "maobv", "#ff922b"),
      },
    });
  }
  if (settings.cci?.visible) {
    paneCharts.push({
      kind: "cci",
      period: numParam(settings.cci, "period", 14),
      colors: { cci: color(settings, "cci", "cci", "#ffa94d") },
    });
  }
  if (settings.wr?.visible) {
    paneCharts.push({
      kind: "wr",
      period: numParam(settings.wr, "period", 14),
      colors: { wr: color(settings, "wr", "wr", "#69db7c") },
    });
  }
  if (settings.dmi?.visible) {
    paneCharts.push({
      kind: "dmi",
      n: numParam(settings.dmi, "n", 14),
      mm: numParam(settings.dmi, "mm", 6),
      colors: {
        pdi: color(settings, "dmi", "pdi", "#ff6b6b"),
        mdi: color(settings, "dmi", "mdi", "#4dabf7"),
        adx: color(settings, "dmi", "adx", "#fcc419"),
        adxr: color(settings, "dmi", "adxr", "#ae3ec9"),
      },
    });
  }
  if (settings.mtm?.visible) {
    paneCharts.push({
      kind: "mtm",
      n: numParam(settings.mtm, "n", 12),
      m: numParam(settings.mtm, "m", 6),
      colors: {
        mtm: color(settings, "mtm", "mtm", "#4dabf7"),
        mamtm: color(settings, "mtm", "mamtm", "#ff922b"),
      },
    });
  }

  for (const extra of options.extras ?? []) {
    const setting = settings[extra.id];
    if (!setting?.visible) continue;
    const spec = {
      kind: "extra" as const,
      id: extra.id,
      setting: {
        visible: setting.visible,
        colors: { ...setting.colors },
        ...(setting.params
          ? {
              params: Object.fromEntries(
                Object.entries(setting.params).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? [...value] : value,
                ]),
              ),
            }
          : {}),
      },
    };
    if (extra.meta.group === "main") mainLayers.push(spec);
    else paneCharts.push(spec);
  }

  return { mainLayers, paneCharts };
};
