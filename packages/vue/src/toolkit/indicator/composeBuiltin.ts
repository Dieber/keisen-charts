import type {
  IndicatorComposePlan,
  IndicatorSetting,
  MainLayerSpec,
  PaneChartSpec,
} from "@keisen-charts/core";
import { h, type VNode, type VNodeChild } from "vue";

import { MACDChart } from "../../charts/MACDChart";
import { VolumeChart } from "../../charts/VolumeChart";
import {
  CCIChart,
  DMIChart,
  KDJChart,
  MTMChart,
  OBVChart,
  RSIChart,
  WRChart,
} from "../../charts/indicatorCharts";
import {
  ADX,
  ADXR,
  BOLL,
  CCI,
  D,
  DEA,
  DIF,
  EMA,
  J,
  K,
  MA,
  MACD,
  MAMTM,
  MAOBV,
  MAVOL,
  MDI,
  MTM,
  OBV,
  PDI,
  RSI,
  SAR,
  SMMA,
  VOL,
  WR,
} from "../../layers";

export type ExtraComposeFns = Record<
  string,
  (setting: IndicatorSetting) => VNodeChild
>;

const composeMainLayer = (
  spec: MainLayerSpec,
  extras: ExtraComposeFns,
): VNodeChild => {
  switch (spec.kind) {
    case "ma":
      return spec.periods.map((period) =>
        h(MA, {
          key: `ma-${period}`,
          period,
          color: spec.colors[`ma${period}`],
        }),
      );
    case "ema":
      return h(EMA, { key: "ema", period: spec.period, color: spec.color });
    case "smma":
      return h(SMMA, { key: "smma", period: spec.period, color: spec.color });
    case "boll":
      return h(BOLL, {
        key: "boll",
        period: spec.period,
        stdDev: spec.stdDev,
        upperColor: spec.colors.upper,
        middleColor: spec.colors.middle,
        lowerColor: spec.colors.lower,
      });
    case "sar":
      return h(SAR, {
        key: "sar",
        start: spec.start,
        step: spec.step,
        max: spec.max,
        color: spec.color,
      });
    case "extra": {
      const create = extras[spec.id];
      return create ? create(spec.setting) : null;
    }
    default:
      return null;
  }
};

const composePaneChart = (
  spec: PaneChartSpec,
  extras: ExtraComposeFns,
): VNodeChild => {
  switch (spec.kind) {
    case "volume":
      return h(VolumeChart, {
        key: "volume",
        maPeriods: spec.maPeriods,
      }, () => [
        h(VOL),
        ...spec.maPeriods.map((period) =>
          h(MAVOL, {
            key: `mavol-${period}`,
            period,
            color: spec.colors[`ma${period}`],
          }),
        ),
      ]);
    case "macd":
      return h(
        MACDChart,
        {
          key: "macd",
          fastPeriod: spec.fastPeriod,
          slowPeriod: spec.slowPeriod,
          signalPeriod: spec.signalPeriod,
        },
        () => [
          h(DIF, { color: spec.colors.dif }),
          h(DEA, { color: spec.colors.dea }),
          h(MACD, { colorUp: spec.colors.up, colorDown: spec.colors.down }),
        ],
      );
    case "rsi":
      return h(RSIChart, { key: "rsi" }, () =>
        spec.periods.map((period) =>
          h(RSI, {
            key: `rsi-${period}`,
            period,
            color: spec.colors[`rsi${period}`],
          }),
        ),
      );
    case "kdj":
      return h(
        KDJChart,
        {
          key: "kdj",
          period: spec.period,
          kPeriod: spec.kPeriod,
          dPeriod: spec.dPeriod,
        },
        () => [
          h(K, { color: spec.colors.k }),
          h(D, { color: spec.colors.d }),
          h(J, { color: spec.colors.j }),
        ],
      );
    case "obv":
      return h(
        OBVChart,
        { key: "obv", maPeriod: spec.maPeriod },
        () => [
          h(OBV, { color: spec.colors.obv }),
          h(MAOBV, { color: spec.colors.maobv }),
        ],
      );
    case "cci":
      return h(
        CCIChart,
        { key: "cci", period: spec.period },
        () => [h(CCI, { color: spec.colors.cci })],
      );
    case "wr":
      return h(
        WRChart,
        { key: "wr", period: spec.period },
        () => [h(WR, { color: spec.colors.wr })],
      );
    case "dmi":
      return h(
        DMIChart,
        { key: "dmi", n: spec.n, mm: spec.mm },
        () => [
          h(PDI, { color: spec.colors.pdi }),
          h(MDI, { color: spec.colors.mdi }),
          h(ADX, { color: spec.colors.adx }),
          h(ADXR, { color: spec.colors.adxr }),
        ],
      );
    case "mtm":
      return h(
        MTMChart,
        { key: "mtm", n: spec.n, m: spec.m },
        () => [
          h(MTM, { color: spec.colors.mtm }),
          h(MAMTM, { color: spec.colors.mamtm }),
        ],
      );
    case "extra": {
      const create = extras[spec.id];
      return create ? create(spec.setting) : null;
    }
    default:
      return null;
  }
};

const flattenNodes = (nodes: VNodeChild[]): VNodeChild[] =>
  nodes.flatMap((node) => (Array.isArray(node) ? node : [node]));

export const composeMainLayers = (
  plan: IndicatorComposePlan,
  extras: ExtraComposeFns = {},
): VNodeChild[] =>
  flattenNodes(
    plan.mainLayers.map((spec) => composeMainLayer(spec, extras)),
  ).filter((node): node is VNodeChild => node != null);

export const composePaneCharts = (
  plan: IndicatorComposePlan,
  extras: ExtraComposeFns = {},
): VNodeChild[] =>
  plan.paneCharts
    .map((spec) => composePaneChart(spec, extras))
    .filter((node): node is VNodeChild => node != null);
