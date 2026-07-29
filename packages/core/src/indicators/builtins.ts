import {
  computeCCI,
  computeDMI,
  computeKDJ,
  computeMACDColumns,
  computeMTM,
  computeOBV,
  computeRSI,
  computeWR,
} from "./indicators";
import { registerIndicator, hasIndicator } from "./registry";
import type {
  IndicatorCalcParams,
  IndicatorDescriptor,
  IndicatorFigure,
  IndicatorResult,
} from "./types";
import { defaultFormatVolume } from "../math/volumeViewport";

const asRecord = (
  params: IndicatorCalcParams,
): Record<string, number | number[]> => {
  if (Array.isArray(params)) {
    return { values: params };
  }
  return params;
};

const num = (
  params: IndicatorCalcParams,
  key: string,
  fallback: number,
): number => {
  const v = asRecord(params)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
};

const numArr = (
  params: IndicatorCalcParams,
  key: string,
  fallback: number[],
): number[] => {
  const v = asRecord(params)[key];
  if (Array.isArray(v)) return v.filter((n) => typeof n === "number");
  return fallback;
};

export const MACD_DESCRIPTOR: IndicatorDescriptor = {
  name: "MACD",
  shortName: "MACD",
  placement: "pane",
  yDomainPolicy: "extentIncludeZero",
  calcParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  figures: [
    { key: "dif", type: "line", layerType: "DIF", style: { color: "#2196F3" } },
    { key: "dea", type: "line", layerType: "DEA", style: { color: "#FF9800" } },
    {
      key: "macd",
      type: "bar",
      layerType: "MACD",
    },
  ],
  calc: (kline, params) =>
    computeMACDColumns(
      kline,
      num(params, "fastPeriod", 12),
      num(params, "slowPeriod", 26),
      num(params, "signalPeriod", 9),
    ),
};

const rsiFigures = (periods: number[]): IndicatorFigure[] =>
  periods.map((period, i) => ({
    key: `rsi_${period}`,
    type: "line" as const,
    layerType: "RSI",
    style: {
      color: ["#ff6b6b", "#4dabf7", "#69db7c"][i % 3],
    },
  }));

export const RSI_DESCRIPTOR: IndicatorDescriptor = {
  name: "RSI",
  shortName: "RSI",
  placement: "pane",
  yDomainPolicy: "extent",
  calcParams: { periods: [6, 12, 24] },
  figures: rsiFigures([6, 12, 24]),
  regenerateFigures: (params) => rsiFigures(numArr(params, "periods", [6, 12, 24])),
  calc: (kline, params) => {
    const periods = numArr(params, "periods", [6, 12, 24]);
    const result: IndicatorResult = {};
    for (const period of periods) {
      result[`rsi_${period}`] = computeRSI(kline, period);
    }
    return result;
  },
};

export const KDJ_DESCRIPTOR: IndicatorDescriptor = {
  name: "KDJ",
  shortName: "KDJ",
  placement: "pane",
  yDomainPolicy: "extent",
  calcParams: { period: 9, kPeriod: 3, dPeriod: 3 },
  figures: [
    { key: "k", type: "line", layerType: "K", style: { color: "#ff6b6b" } },
    { key: "d", type: "line", layerType: "D", style: { color: "#4dabf7" } },
    { key: "j", type: "line", layerType: "J", style: { color: "#69db7c" } },
  ],
  calc: (kline, params) =>
    computeKDJ(
      kline,
      num(params, "period", 9),
      num(params, "kPeriod", 3),
      num(params, "dPeriod", 3),
    ),
};

export const OBV_DESCRIPTOR: IndicatorDescriptor = {
  name: "OBV",
  shortName: "OBV",
  placement: "pane",
  yDomainPolicy: "extent",
  calcParams: { maPeriod: 30 },
  figures: [
    { key: "obv", type: "line", layerType: "OBV", style: { color: "#4dabf7" } },
    {
      key: "maobv",
      type: "line",
      layerType: "MAOBV",
      style: { color: "#ff922b" },
    },
  ],
  calc: (kline, params) => {
    const obv = computeOBV(kline);
    const maPeriod = num(params, "maPeriod", 30);
    const maobv: (number | null)[] = new Array(kline.length).fill(null);
    if (maPeriod > 0) {
      for (let i = maPeriod - 1; i < kline.length; i++) {
        let sum = 0;
        let ok = true;
        for (let j = i - maPeriod + 1; j <= i; j++) {
          if (obv[j] === null) {
            ok = false;
            break;
          }
          sum += obv[j]!;
        }
        if (ok) maobv[i] = sum / maPeriod;
      }
    }
    return { obv, maobv };
  },
};

export const CCI_DESCRIPTOR: IndicatorDescriptor = {
  name: "CCI",
  shortName: "CCI",
  placement: "pane",
  yDomainPolicy: "extentIncludeZero",
  calcParams: { period: 14 },
  figures: [
    { key: "cci", type: "line", layerType: "CCI", style: { color: "#ffa94d" } },
  ],
  calc: (kline, params) => ({
    cci: computeCCI(kline, num(params, "period", 14)),
  }),
};

export const WR_DESCRIPTOR: IndicatorDescriptor = {
  name: "WR",
  shortName: "WR",
  placement: "pane",
  yDomainPolicy: "extent",
  calcParams: { period: 14 },
  figures: [
    { key: "wr", type: "line", layerType: "WR", style: { color: "#69db7c" } },
  ],
  calc: (kline, params) => ({
    wr: computeWR(kline, num(params, "period", 14)),
  }),
};

export const DMI_DESCRIPTOR: IndicatorDescriptor = {
  name: "DMI",
  shortName: "DMI",
  placement: "pane",
  yDomainPolicy: "extent",
  calcParams: { n: 14, mm: 6 },
  figures: [
    { key: "pdi", type: "line", layerType: "PDI", style: { color: "#ff6b6b" } },
    { key: "mdi", type: "line", layerType: "MDI", style: { color: "#4dabf7" } },
    { key: "adx", type: "line", layerType: "ADX", style: { color: "#fcc419" } },
    {
      key: "adxr",
      type: "line",
      layerType: "ADXR",
      style: { color: "#ae3ec9" },
    },
  ],
  calc: (kline, params) =>
    computeDMI(kline, num(params, "n", 14), num(params, "mm", 6)),
};

export const MTM_DESCRIPTOR: IndicatorDescriptor = {
  name: "MTM",
  shortName: "MTM",
  placement: "pane",
  yDomainPolicy: "extentIncludeZero",
  calcParams: { n: 12, m: 6 },
  figures: [
    { key: "mtm", type: "line", layerType: "MTM", style: { color: "#4dabf7" } },
    {
      key: "mamtm",
      type: "line",
      layerType: "MAMTM",
      style: { color: "#ff922b" },
    },
  ],
  calc: (kline, params) =>
    computeMTM(kline, num(params, "n", 12), num(params, "m", 6)),
};

const DEFAULT_VOLUME_MA_PERIODS = [5, 10, 20];
const VOLUME_MA_COLORS = ["#2196F3", "#FF9800", "#9C27B0"];

const volumeBarFigure = (): IndicatorFigure => ({
  key: "v",
  type: "bar",
  layerType: "VOL",
  style: {
    barColorBy: "candle",
    showZeroLine: false,
  },
});

const volumeMaFigures = (periods: number[]): IndicatorFigure[] =>
  periods.map((period, i) => ({
    key: `ma${period}`,
    type: "line" as const,
    layerType: "MAVOL",
    style: {
      color: VOLUME_MA_COLORS[i % VOLUME_MA_COLORS.length],
    },
  }));

const volumeFigures = (periods: number[]): IndicatorFigure[] => [
  volumeBarFigure(),
  ...volumeMaFigures(periods),
];

const computeVolumeMA = (
  volumes: number[],
  period: number,
): (number | null)[] => {
  const result: (number | null)[] = new Array(volumes.length).fill(null);
  if (period <= 0) return result;
  for (let i = period - 1; i < volumes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += volumes[j]!;
    }
    result[i] = sum / period;
  }
  return result;
};

export const VOLUME_DESCRIPTOR: IndicatorDescriptor = {
  name: "VOLUME",
  shortName: "VOL",
  placement: "pane",
  yDomainPolicy: "fromZero",
  formatTick: defaultFormatVolume,
  calcParams: { maPeriods: [...DEFAULT_VOLUME_MA_PERIODS] },
  figures: volumeFigures(DEFAULT_VOLUME_MA_PERIODS),
  regenerateFigures: (params) =>
    volumeFigures(numArr(params, "maPeriods", DEFAULT_VOLUME_MA_PERIODS)),
  calc: (kline, params) => {
    const volumes = kline.map((bar) => bar.v);
    const periods = numArr(params, "maPeriods", DEFAULT_VOLUME_MA_PERIODS);
    const result: IndicatorResult = { v: volumes };
    for (const period of periods) {
      result[`ma${period}`] = computeVolumeMA(volumes, period);
    }
    return result;
  },
};

const BUILTIN_DESCRIPTORS: IndicatorDescriptor[] = [
  VOLUME_DESCRIPTOR,
  MACD_DESCRIPTOR,
  RSI_DESCRIPTOR,
  KDJ_DESCRIPTOR,
  OBV_DESCRIPTOR,
  CCI_DESCRIPTOR,
  WR_DESCRIPTOR,
  DMI_DESCRIPTOR,
  MTM_DESCRIPTOR,
];

let builtinsRegistered = false;

export const registerBuiltinIndicators = (): void => {
  for (const desc of BUILTIN_DESCRIPTORS) {
    if (!hasIndicator(desc.name)) {
      registerIndicator(desc);
    }
  }
  builtinsRegistered = true;
};

/** 测试辅助 */
export const resetBuiltinIndicatorsForTest = (): void => {
  builtinsRegistered = false;
};

void builtinsRegistered;
