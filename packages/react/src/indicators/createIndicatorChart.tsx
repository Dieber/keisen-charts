import {
  Children,
  createElement,
  isValidElement,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  getIndicator,
  mergeCalcParams,
  registerIndicator as registerIndicatorCore,
  type IndicatorDescriptor,
  type IndicatorFigure,
} from "@keisen-charts/core";

import { registerChartSlot } from "../layout/chartLayout";
import { IndicatorPane } from "../panes/indicator-pane/IndicatorPane";
import { createFigureLayerComponent } from "./createIndicatorLayers";

export type CreateIndicatorChartOptions = {
  /** 覆盖默认 paneId（默认 name.toLowerCase()） */
  paneId?: string;
  /** 无 children 时是否自动生成默认 LayerChildren（默认 true） */
  autoDefaultLayers?: boolean;
};

export type IndicatorChartProps = {
  children?: ReactNode;
  /** 透传为 calcParams 的字段（与描述符 calcParams 合并） */
  [key: string]: unknown;
};

const defaultLayersFromFigures = (
  figures: IndicatorFigure[],
  indicatorName: string,
): ReactNode[] =>
  figures.map((figure) => {
    const Layer = createFigureLayerComponent(indicatorName, figure);
    return createElement(Layer, {
      key: figure.key,
      ...(figure.type === "line" && figure.style?.color
        ? { color: figure.style.color }
        : {}),
      ...(figure.type === "bar"
        ? {
            colorUp: figure.style?.colorUp,
            colorDown: figure.style?.colorDown,
            color: figure.style?.color,
          }
        : {}),
      ...(figure.layerType === "RSI" && figure.key.startsWith("rsi_")
        ? { period: Number(figure.key.slice(4)) }
        : {}),
      ...(figure.layerType === "MAVOL" && figure.key.startsWith("ma")
        ? { period: Number(figure.key.slice(2)) }
        : {}),
    });
  });

const collectPeriodProps = (children: ReactNode): number[] => {
  const periods: number[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const period = (child.props as { period?: number }).period;
    if (typeof period === "number" && Number.isFinite(period)) {
      periods.push(period);
    }
  });
  return periods;
};

/**
 * 根据已注册指标名创建声明式 Chart 组件。
 */
export const createIndicatorChart = (
  indicatorName: string,
  options: CreateIndicatorChartOptions = {},
): ComponentType<IndicatorChartProps> => {
  const paneId = options.paneId ?? indicatorName.toLowerCase();
  const autoDefaultLayers = options.autoDefaultLayers !== false;

  const Chart = (props: IndicatorChartProps) => {
    const descriptor = getIndicator(indicatorName);
    if (!descriptor) {
      throw new Error(
        `[keisen] createIndicatorChart: indicator "${indicatorName}" is not registered`,
      );
    }

    const { children, ...rest } = props;
    let calcParams = mergeCalcParams(descriptor.calcParams, rest);

    if (children != null) {
      const periods = collectPeriodProps(children);
      if (periods.length > 0) {
        if (indicatorName === "RSI") {
          calcParams = {
            ...(calcParams as Record<string, number | number[]>),
            periods,
          };
        } else if (indicatorName === "VOLUME") {
          calcParams = {
            ...(calcParams as Record<string, number | number[]>),
            maPeriods: periods,
          };
        }
      }
    }

    const figures =
      descriptor.regenerateFigures?.(calcParams) ?? descriptor.figures;

    const layerChildren =
      children ??
      (autoDefaultLayers
        ? defaultLayersFromFigures(figures, indicatorName)
        : defaultLayersFromFigures(figures, indicatorName));

    return createElement(IndicatorPane, {
      paneId,
      indicatorName,
      calcParams,
      layerChildren,
    });
  };

  Chart.displayName = `${indicatorName}Chart`;
  registerChartSlot(Chart.displayName, paneId);
  return Chart;
};

/**
 * React 包入口：注册描述符并登记 layout slot。
 */
export const registerIndicator = (
  descriptor: IndicatorDescriptor,
  options?: CreateIndicatorChartOptions,
): ComponentType<IndicatorChartProps> => {
  registerIndicatorCore(descriptor);
  const paneId = options?.paneId ?? descriptor.name.toLowerCase();
  registerChartSlot(`${descriptor.name}Chart`, paneId);
  const figures =
    descriptor.regenerateFigures?.(descriptor.calcParams) ?? descriptor.figures;
  for (const figure of figures) {
    createFigureLayerComponent(descriptor.name, figure);
  }
  return createIndicatorChart(descriptor.name, { ...options, paneId });
};
