import { IndicatorBarLayer } from "../renderer/views/indicator/layers/IndicatorBarLayer";
import { IndicatorLineLayer } from "../renderer/views/indicator/layers/IndicatorLineLayer";
import type { IndicatorFigure } from "../indicators/types";
import { registerLayerType } from "./layerRegistry";

const registeredLayerTypes = new Set<string>();

const optionalColor = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/**
 * 为 figure 注册 layerType 工厂。
 * layerType 优先用 figure.layerType（如 DIF），否则用 `${indicator}:${key}`。
 * 返回最终 layerType 字符串。
 */
export const registerFigureLayerType = (
  indicatorName: string,
  figure: IndicatorFigure,
): string => {
  const layerType = figure.layerType ?? `${indicatorName}:${figure.key}`;

  if (registeredLayerTypes.has(layerType)) {
    return layerType;
  }

  registeredLayerTypes.add(layerType);
  registerLayerType(layerType, {
    createCoreLayer: (props) => {
      let resultKey = figure.key;
      // RSI：period prop → rsi_${period}
      if (layerType === "RSI" && typeof props.period === "number") {
        resultKey = `rsi_${props.period}`;
      }
      // MAVOL：period prop → ma${period}
      if (layerType === "MAVOL" && typeof props.period === "number") {
        resultKey = `ma${props.period}`;
      }

      if (figure.type === "bar") {
        return new IndicatorBarLayer(resultKey, {
          colorUp:
            optionalColor(props.colorUp) ??
            optionalColor(props.color) ??
            figure.style?.colorUp,
          colorDown:
            optionalColor(props.colorDown) ?? figure.style?.colorDown,
          barColorBy: figure.style?.barColorBy,
          showZeroLine: figure.style?.showZeroLine,
        });
      }

      return new IndicatorLineLayer(resultKey, {
        color:
          optionalColor(props.color) ?? figure.style?.color ?? "#2196F3",
        lineWidth:
          typeof props.lineWidth === "number"
            ? props.lineWidth
            : figure.style?.lineWidth,
      });
    },
  });

  return layerType;
};

/** 测试用 */
export const clearFigureLayerTypes = (): void => {
  registeredLayerTypes.clear();
};
