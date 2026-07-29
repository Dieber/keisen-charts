import {
  createIndicatorController,
  type CreateIndicatorControllerOptions,
  type IndicatorExtraMeta,
  type IndicatorPanelProps,
  type IndicatorSetting,
  type IndicatorSettings,
} from "@keisen-charts/core";
import { useRef, useSyncExternalStore, type ReactNode } from "react";

import {
  composeMainLayers,
  composePaneCharts,
  type ExtraComposeFns,
} from "./composeBuiltin";

export type useKlineIndicatorExtra = IndicatorExtraMeta & {
  createChart: (setting: IndicatorSetting) => ReactNode;
};

export type useKlineIndicatorOptions = {
  defaults?: CreateIndicatorControllerOptions["defaults"];
  extras?: useKlineIndicatorExtra[];
  maPeriods?: number[];
  /** When false, only settings + setters are returned (escape hatch). */
  compose?: boolean;
};

export type useKlineIndicatorResult = {
  settings: IndicatorSettings;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (
    id: string,
    params: Record<string, number | number[]>,
  ) => void;
  reset: () => void;
  panelProps: IndicatorPanelProps;
  mainLayers: ReactNode[];
  paneCharts: ReactNode[];
};

export const useKlineIndicator = (
  options: useKlineIndicatorOptions = {},
): useKlineIndicatorResult => {
  const compose = options.compose !== false;
  const extrasRef = useRef<useKlineIndicatorExtra[]>(options.extras ?? []);
  extrasRef.current = options.extras ?? [];

  const controllerRef = useRef<ReturnType<
    typeof createIndicatorController
  > | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createIndicatorController({
      defaults: options.defaults,
      maPeriods: options.maPeriods,
      extras: (options.extras ?? []).map(
        ({ id, meta, defaultSetting }): IndicatorExtraMeta => ({
          id,
          meta,
          defaultSetting,
        }),
      ),
    });
  }
  const controller = controllerRef.current;

  const settings = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  const extraFns: ExtraComposeFns = {};
  for (const extra of extrasRef.current) {
    extraFns[extra.id] = extra.createChart;
  }

  const plan = compose ? controller.getComposePlan() : null;

  return {
    settings,
    setVisible: controller.setVisible,
    setColor: controller.setColor,
    setParams: controller.setParams,
    reset: controller.reset,
    panelProps: controller.getPanelProps(),
    mainLayers: plan ? composeMainLayers(plan, extraFns) : [],
    paneCharts: plan ? composePaneCharts(plan, extraFns) : [],
  };
};
