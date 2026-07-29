import {
  getIndicator,
  mergeCalcParams,
  registerIndicator as registerIndicatorCore,
  type IndicatorCalcParams,
  type IndicatorDescriptor,
  type IndicatorFigure,
} from "@keisen-charts/core";
import {
  Comment,
  Fragment,
  Text,
  defineComponent,
  h,
  type Component,
  type PropType,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
} from "vue";

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
  children?: VNodeChild;
  /** 透传为 calcParams 的字段（与描述符 calcParams 合并） */
  [key: string]: unknown;
};

const isVNode = (node: VNodeChild): node is VNode =>
  typeof node === "object" && node !== null && !Array.isArray(node) && "type" in node;

const normalizeChildren = (children: VNodeChild | VNodeArrayChildren): VNodeChild[] => {
  if (children == null || children === false || children === true) return [];
  if (Array.isArray(children)) {
    return children.flatMap((child) => normalizeChildren(child as VNodeChild));
  }
  return [children];
};

const defaultLayersFromFigures = (
  figures: IndicatorFigure[],
  indicatorName: string,
): VNode[] =>
  figures.map((figure) => {
    const Layer = createFigureLayerComponent(indicatorName, figure);
    return h(Layer, {
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

const collectPeriodProps = (children: VNodeChild | VNodeArrayChildren): number[] => {
  const periods: number[] = [];
  for (const child of normalizeChildren(children)) {
    if (!isVNode(child)) continue;
    if (child.type === Comment || child.type === Text) continue;
    if (child.type === Fragment) {
      periods.push(...collectPeriodProps(child.children as VNodeArrayChildren));
      continue;
    }
    const period = (child.props as { period?: number } | null)?.period;
    if (typeof period === "number" && Number.isFinite(period)) {
      periods.push(period);
    }
  }
  return periods;
};

/**
 * Create a declarative Chart component from a registered indicator name.
 */
export const createIndicatorChart = (
  indicatorName: string,
  options: CreateIndicatorChartOptions = {},
): Component => {
  const paneId = options.paneId ?? indicatorName.toLowerCase();

  const Chart = defineComponent({
    name: `${indicatorName}Chart`,
    setup(_props, { attrs, slots }) {
      return () => {
        const descriptor = getIndicator(indicatorName);
        if (!descriptor) {
          throw new Error(
            `[keisen] createIndicatorChart: indicator "${indicatorName}" is not registered`,
          );
        }

        const rest = { ...attrs } as Record<string, unknown>;
        delete rest.children;

        let calcParams = mergeCalcParams(
          descriptor.calcParams,
          rest,
        ) as IndicatorCalcParams;

        const slotChildren = slots.default?.();
        if (slotChildren != null) {
          const periods = collectPeriodProps(slotChildren);
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
          slotChildren && slotChildren.length > 0
            ? slotChildren
            : defaultLayersFromFigures(figures, indicatorName);

        return h(IndicatorPane, {
          paneId,
          indicatorName,
          calcParams,
          layerChildren,
        });
      };
    },
  });

  (Chart as typeof Chart & { displayName: string }).displayName =
    `${indicatorName}Chart`;
  registerChartSlot(`${indicatorName}Chart`, paneId);
  return Chart;
};

/**
 * Register descriptor and return a Vue Chart component.
 */
export const registerIndicator = (
  descriptor: IndicatorDescriptor,
  options?: CreateIndicatorChartOptions,
): Component => {
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
