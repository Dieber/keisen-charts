import type {
  IndicatorComposePlan,
  IndicatorSetting,
  MainLayerSpec,
  PaneChartSpec,
} from "@keisen-charts/core";
import type { ReactNode } from "react";

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
  (setting: IndicatorSetting) => ReactNode
>;

const composeMainLayer = (
  spec: MainLayerSpec,
  extras: ExtraComposeFns,
): ReactNode => {
  switch (spec.kind) {
    case "ma":
      return spec.periods.map((period) => (
        <MA
          key={`ma-${period}`}
          period={period}
          color={spec.colors[`ma${period}`]}
        />
      ));
    case "ema":
      return <EMA key="ema" period={spec.period} color={spec.color} />;
    case "smma":
      return <SMMA key="smma" period={spec.period} color={spec.color} />;
    case "boll":
      return (
        <BOLL
          key="boll"
          period={spec.period}
          stdDev={spec.stdDev}
          upperColor={spec.colors.upper}
          middleColor={spec.colors.middle}
          lowerColor={spec.colors.lower}
        />
      );
    case "sar":
      return (
        <SAR
          key="sar"
          start={spec.start}
          step={spec.step}
          max={spec.max}
          color={spec.color}
        />
      );
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
): ReactNode => {
  switch (spec.kind) {
    case "volume":
      return (
        <VolumeChart
          key="volume"
          maPeriods={spec.maPeriods}
        >
          <VOL />
          {spec.maPeriods.map((period) => (
            <MAVOL
              key={`mavol-${period}`}
              period={period}
              color={spec.colors[`ma${period}`]}
            />
          ))}
        </VolumeChart>
      );
    case "macd":
      return (
        <MACDChart
          key="macd"
          fastPeriod={spec.fastPeriod}
          slowPeriod={spec.slowPeriod}
          signalPeriod={spec.signalPeriod}
        >
          <DIF color={spec.colors.dif} />
          <DEA color={spec.colors.dea} />
          <MACD colorUp={spec.colors.up} colorDown={spec.colors.down} />
        </MACDChart>
      );
    case "rsi":
      return (
        <RSIChart key="rsi">
          {spec.periods.map((period) => (
            <RSI
              key={`rsi-${period}`}
              period={period}
              color={spec.colors[`rsi${period}`]}
            />
          ))}
        </RSIChart>
      );
    case "kdj":
      return (
        <KDJChart
          key="kdj"
          period={spec.period}
          kPeriod={spec.kPeriod}
          dPeriod={spec.dPeriod}
        >
          <K color={spec.colors.k} />
          <D color={spec.colors.d} />
          <J color={spec.colors.j} />
        </KDJChart>
      );
    case "obv":
      return (
        <OBVChart key="obv" maPeriod={spec.maPeriod}>
          <OBV color={spec.colors.obv} />
          <MAOBV color={spec.colors.maobv} />
        </OBVChart>
      );
    case "cci":
      return (
        <CCIChart key="cci" period={spec.period}>
          <CCI color={spec.colors.cci} />
        </CCIChart>
      );
    case "wr":
      return (
        <WRChart key="wr" period={spec.period}>
          <WR color={spec.colors.wr} />
        </WRChart>
      );
    case "dmi":
      return (
        <DMIChart key="dmi" n={spec.n} mm={spec.mm}>
          <PDI color={spec.colors.pdi} />
          <MDI color={spec.colors.mdi} />
          <ADX color={spec.colors.adx} />
          <ADXR color={spec.colors.adxr} />
        </DMIChart>
      );
    case "mtm":
      return (
        <MTMChart key="mtm" n={spec.n} m={spec.m}>
          <MTM color={spec.colors.mtm} />
          <MAMTM color={spec.colors.mamtm} />
        </MTMChart>
      );
    case "extra": {
      const create = extras[spec.id];
      return create ? create(spec.setting) : null;
    }
    default:
      return null;
  }
};

export const composeMainLayers = (
  plan: IndicatorComposePlan,
  extras: ExtraComposeFns = {},
): ReactNode[] =>
  plan.mainLayers
    .map((spec) => composeMainLayer(spec, extras))
    .flat()
    .filter((node): node is ReactNode => node != null);

export const composePaneCharts = (
  plan: IndicatorComposePlan,
  extras: ExtraComposeFns = {},
): ReactNode[] =>
  plan.paneCharts
    .map((spec) => composePaneChart(spec, extras))
    .filter((node): node is ReactNode => node != null);
