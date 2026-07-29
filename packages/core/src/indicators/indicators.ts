import type { KlineBar } from "../types/kline";

/**
 * 简单移动平均线（SMA）。
 * 前 period-1 根为 null（数据不足，不参与绘制）。
 */
export const computeSMA = (
  kline: KlineBar[],
  period: number,
): (number | null)[] => {
  if (period <= 0) return kline.map(() => null);

  const result: (number | null)[] = new Array(kline.length).fill(null);

  for (let i = period - 1; i < kline.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += kline[j]!.c;
    }
    result[i] = sum / period;
  }

  return result;
};

/**
 * 指数移动平均线（EMA）。
 * 第 period-1 根用 SMA 初始化，之后递推。
 */
export const computeEMA = (
  kline: KlineBar[],
  period: number,
): (number | null)[] => {
  if (period <= 0) return kline.map(() => null);

  const result: (number | null)[] = new Array(kline.length).fill(null);
  if (kline.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += kline[i]!.c;
  }
  let ema = sum / period;
  result[period - 1] = ema;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < kline.length; i++) {
    ema = (kline[i]!.c - ema) * multiplier + ema;
    result[i] = ema;
  }

  return result;
};

/**
 * 平滑移动平均线（SMMA / Wilder smoothing）。
 * 第 period-1 根用 SMA 初始化，之后递推。
 */
export const computeSMMA = (
  kline: KlineBar[],
  period: number,
): (number | null)[] => {
  if (period <= 0) return kline.map(() => null);

  const result: (number | null)[] = new Array(kline.length).fill(null);
  if (kline.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += kline[i]!.c;
  }
  let smma = sum / period;
  result[period - 1] = smma;

  for (let i = period; i < kline.length; i++) {
    smma = (smma * (period - 1) + kline[i]!.c) / period;
    result[i] = smma;
  }

  return result;
};

export type BOLLResult = {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
};

/**
 * 布林带（BOLL）。
 * middle = SMA；std 为窗口内总体标准差；上下轨 = middle ± stdDev * std。
 */
export const computeBOLL = (
  kline: KlineBar[],
  period: number = 20,
  stdDev: number = 2,
): BOLLResult => {
  const n = kline.length;
  const upper: (number | null)[] = new Array(n).fill(null);
  const middle: (number | null)[] = new Array(n).fill(null);
  const lower: (number | null)[] = new Array(n).fill(null);

  if (period <= 0 || stdDev <= 0 || n < period) {
    return { upper, middle, lower };
  }

  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += kline[j]!.c;
    }
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = kline[j]!.c - mean;
      variance += diff * diff;
    }
    const std = Math.sqrt(variance / period);

    middle[i] = mean;
    upper[i] = mean + stdDev * std;
    lower[i] = mean - stdDev * std;
  }

  return { upper, middle, lower };
};

/**
 * 抛物线 SAR。
 * start/step/max 为百分比整数（如 2 表示 0.02），内部除以 100。
 */
export const computeSAR = (
  kline: KlineBar[],
  startPercent: number = 2,
  stepPercent: number = 2,
  maxPercent: number = 20,
): (number | null)[] => {
  const n = kline.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (n < 2) return result;

  const start = startPercent / 100;
  const step = stepPercent / 100;
  const max = maxPercent / 100;

  let isUpTrend = kline[1]!.c >= kline[0]!.c;
  let sar = isUpTrend
    ? Math.min(kline[0]!.l, kline[1]!.l)
    : Math.max(kline[0]!.h, kline[1]!.h);
  let ep = isUpTrend
    ? Math.max(kline[0]!.h, kline[1]!.h)
    : Math.min(kline[0]!.l, kline[1]!.l);
  let af = start;

  result[1] = sar;

  for (let i = 2; i < n; i++) {
    const bar = kline[i]!;
    const prevBar = kline[i - 1]!;
    const prevPrevBar = kline[i - 2]!;

    sar = sar + af * (ep - sar);

    if (isUpTrend) {
      sar = Math.min(sar, prevBar.l, prevPrevBar.l);

      if (bar.l < sar) {
        isUpTrend = false;
        sar = ep;
        ep = bar.l;
        af = start;
      } else if (bar.h > ep) {
        ep = bar.h;
        af = Math.min(af + step, max);
      }
    } else {
      sar = Math.max(sar, prevBar.h, prevPrevBar.h);

      if (bar.h > sar) {
        isUpTrend = true;
        sar = ep;
        ep = bar.h;
        af = start;
      } else if (bar.l < ep) {
        ep = bar.l;
        af = Math.min(af + step, max);
      }
    }

    result[i] = sar;
  }

  return result;
};

export type MACDPoint = {
  dif: number | null;
  dea: number | null;
  macd: number | null;
};

/**
 * MACD：DIF = EMA(fast) - EMA(slow)；DEA = EMA(DIF, signal)；MACD = 2 * (DIF - DEA)。
 * 各序列在对应 EMA 尚未就绪前为 null。
 */
export const computeMACD = (
  kline: KlineBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): MACDPoint[] => {
  const n = kline.length;
  const empty: MACDPoint[] = Array.from({ length: n }, () => ({
    dif: null,
    dea: null,
    macd: null,
  }));

  if (
    fastPeriod <= 0 ||
    slowPeriod <= 0 ||
    signalPeriod <= 0 ||
    n === 0
  ) {
    return empty;
  }

  const fastEMA = computeEMA(kline, fastPeriod);
  const slowEMA = computeEMA(kline, slowPeriod);

  const dif: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const fast = fastEMA[i];
    const slow = slowEMA[i];
    if (fast === null || slow === null) continue;
    dif[i] = fast - slow;
  }

  // DEA：对 DIF 做 EMA（跳过 null 前缀，用 SMA 种子）
  const dea: (number | null)[] = new Array(n).fill(null);
  const difValues: { index: number; value: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (dif[i] !== null) {
      difValues.push({ index: i, value: dif[i]! });
    }
  }

  if (difValues.length >= signalPeriod) {
    let sum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      sum += difValues[i]!.value;
    }
    let ema = sum / signalPeriod;
    dea[difValues[signalPeriod - 1]!.index] = ema;

    const multiplier = 2 / (signalPeriod + 1);
    for (let i = signalPeriod; i < difValues.length; i++) {
      ema = (difValues[i]!.value - ema) * multiplier + ema;
      dea[difValues[i]!.index] = ema;
    }
  }

  const result: MACDPoint[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const d = dif[i];
    const e = dea[i];
    result[i] = {
      dif: d,
      dea: e,
      macd: d !== null && e !== null ? 2 * (d - e) : null,
    };
  }

  return result;
};

/**
 * RSI（Wilder）。前 period 根为 null；period 根用平均涨跌初始化。
 */
export const computeRSI = (
  kline: KlineBar[],
  period: number,
): (number | null)[] => {
  const n = kline.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = kline[i]!.c - kline[i - 1]!.c;
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < n; i++) {
    const change = kline[i]!.c - kline[i - 1]!.c;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
};

export type KDJResult = {
  k: (number | null)[];
  d: (number | null)[];
  j: (number | null)[];
};

/**
 * KDJ：RSV → K/D 平滑 → J = 3K - 2D。
 */
export const computeKDJ = (
  kline: KlineBar[],
  period: number = 9,
  kPeriod: number = 3,
  dPeriod: number = 3,
): KDJResult => {
  const n = kline.length;
  const k: (number | null)[] = new Array(n).fill(null);
  const d: (number | null)[] = new Array(n).fill(null);
  const j: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || kPeriod <= 0 || dPeriod <= 0 || n === 0) {
    return { k, d, j };
  }

  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < n; i++) {
    if (i < period - 1) continue;

    let highest = -Infinity;
    let lowest = Infinity;
    for (let t = i - period + 1; t <= i; t++) {
      highest = Math.max(highest, kline[t]!.h);
      lowest = Math.min(lowest, kline[t]!.l);
    }
    const range = highest - lowest;
    const rsv = range === 0 ? 50 : ((kline[i]!.c - lowest) / range) * 100;
    const kVal = (prevK * (kPeriod - 1) + rsv) / kPeriod;
    const dVal = (prevD * (dPeriod - 1) + kVal) / dPeriod;
    prevK = kVal;
    prevD = dVal;
    k[i] = kVal;
    d[i] = dVal;
    j[i] = 3 * kVal - 2 * dVal;
  }

  return { k, d, j };
};

/**
 * OBV：涨量加、跌量减。
 */
export const computeOBV = (kline: KlineBar[]): (number | null)[] => {
  const n = kline.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (n === 0) return result;

  let obv = 0;
  result[0] = 0;
  for (let i = 1; i < n; i++) {
    if (kline[i]!.c > kline[i - 1]!.c) obv += kline[i]!.v;
    else if (kline[i]!.c < kline[i - 1]!.c) obv -= kline[i]!.v;
    result[i] = obv;
  }
  return result;
};

/**
 * CCI。
 */
export const computeCCI = (
  kline: KlineBar[],
  period: number = 14,
): (number | null)[] => {
  const n = kline.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n < period) return result;

  const tp = kline.map((b) => (b.h + b.l + b.c) / 3);

  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += tp[j]!;
    const mean = sum / period;
    let mad = 0;
    for (let j = i - period + 1; j <= i; j++) mad += Math.abs(tp[j]! - mean);
    mad /= period;
    result[i] = mad === 0 ? 0 : (tp[i]! - mean) / (0.015 * mad);
  }

  return result;
};

/**
 * Williams %R。
 */
export const computeWR = (
  kline: KlineBar[],
  period: number = 14,
): (number | null)[] => {
  const n = kline.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (period <= 0 || n < period) return result;

  for (let i = period - 1; i < n; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      highest = Math.max(highest, kline[j]!.h);
      lowest = Math.min(lowest, kline[j]!.l);
    }
    const range = highest - lowest;
    result[i] = range === 0 ? 0 : ((highest - kline[i]!.c) / range) * -100;
  }

  return result;
};

export type DMIResult = {
  pdi: (number | null)[];
  mdi: (number | null)[];
  adx: (number | null)[];
  adxr: (number | null)[];
};

/**
 * DMI / ADX。
 */
export const computeDMI = (
  kline: KlineBar[],
  nPeriod: number = 14,
  mm: number = 6,
): DMIResult => {
  const len = kline.length;
  const pdi: (number | null)[] = new Array(len).fill(null);
  const mdi: (number | null)[] = new Array(len).fill(null);
  const adx: (number | null)[] = new Array(len).fill(null);
  const adxr: (number | null)[] = new Array(len).fill(null);
  if (nPeriod <= 0 || mm <= 0 || len < 2) {
    return { pdi, mdi, adx, adxr };
  }

  const tr: number[] = new Array(len).fill(0);
  const plusDM: number[] = new Array(len).fill(0);
  const minusDM: number[] = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const high = kline[i]!.h;
    const low = kline[i]!.l;
    const prevClose = kline[i - 1]!.c;
    const prevHigh = kline[i - 1]!.h;
    const prevLow = kline[i - 1]!.l;
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }

  let atr = 0;
  let plusDMSum = 0;
  let minusDMSum = 0;
  for (let i = 1; i <= nPeriod; i++) {
    atr += tr[i]!;
    plusDMSum += plusDM[i]!;
    minusDMSum += minusDM[i]!;
  }

  const dxArr: (number | null)[] = new Array(len).fill(null);

  for (let i = nPeriod; i < len; i++) {
    if (i > nPeriod) {
      atr = atr - atr / nPeriod + tr[i]!;
      plusDMSum = plusDMSum - plusDMSum / nPeriod + plusDM[i]!;
      minusDMSum = minusDMSum - minusDMSum / nPeriod + minusDM[i]!;
    }

    const plusDI = atr === 0 ? 0 : (plusDMSum / atr) * 100;
    const minusDI = atr === 0 ? 0 : (minusDMSum / atr) * 100;
    pdi[i] = plusDI;
    mdi[i] = minusDI;
    const diSum = plusDI + minusDI;
    dxArr[i] = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
  }

  // ADX：对 DX 做 Wilder 平滑
  let adxSeed: number | null = null;
  let seedSum = 0;
  let seedCount = 0;
  for (let i = 0; i < len; i++) {
    if (dxArr[i] === null) continue;
    if (adxSeed === null) {
      seedSum += dxArr[i]!;
      seedCount += 1;
      if (seedCount === nPeriod) {
        adxSeed = seedSum / nPeriod;
        adx[i] = adxSeed;
      }
      continue;
    }
    adxSeed = (adxSeed * (nPeriod - 1) + dxArr[i]!) / nPeriod;
    adx[i] = adxSeed;
  }

  for (let i = 0; i < len; i++) {
    if (adx[i] === null) continue;
    const prevIdx = i - mm;
    if (prevIdx >= 0 && adx[prevIdx] !== null) {
      adxr[i] = (adx[i]! + adx[prevIdx]!) / 2;
    }
  }

  return { pdi, mdi, adx, adxr };
};

export type MTMResult = {
  mtm: (number | null)[];
  mamtm: (number | null)[];
};

/**
 * MTM = close - close[n]；MAMTM = SMA(MTM, m)。
 */
export const computeMTM = (
  kline: KlineBar[],
  nPeriod: number = 12,
  mPeriod: number = 6,
): MTMResult => {
  const len = kline.length;
  const mtm: (number | null)[] = new Array(len).fill(null);
  const mamtm: (number | null)[] = new Array(len).fill(null);
  if (nPeriod <= 0 || mPeriod <= 0) return { mtm, mamtm };

  for (let i = nPeriod; i < len; i++) {
    mtm[i] = kline[i]!.c - kline[i - nPeriod]!.c;
  }

  for (let i = 0; i < len; i++) {
    if (i < nPeriod + mPeriod - 1) continue;
    let sum = 0;
    let ok = true;
    for (let j = i - mPeriod + 1; j <= i; j++) {
      if (mtm[j] === null) {
        ok = false;
        break;
      }
      sum += mtm[j]!;
    }
    if (ok) mamtm[i] = sum / mPeriod;
  }

  return { mtm, mamtm };
};

/** MACD 列式结果，供 GenericIndicatorView 使用 */
export const computeMACDColumns = (
  kline: KlineBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): { dif: (number | null)[]; dea: (number | null)[]; macd: (number | null)[] } => {
  const points = computeMACD(kline, fastPeriod, slowPeriod, signalPeriod);
  return {
    dif: points.map((p) => p.dif),
    dea: points.map((p) => p.dea),
    macd: points.map((p) => p.macd),
  };
};
