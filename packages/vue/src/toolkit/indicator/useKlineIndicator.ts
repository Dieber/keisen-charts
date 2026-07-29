import {
  createIndicatorController,
  type CreateIndicatorControllerOptions,
  type IndicatorExtraMeta,
  type IndicatorPanelProps,
  type IndicatorSetting,
  type IndicatorSettings,
} from "@keisen-charts/core";
import {
  computed,
  onScopeDispose,
  readonly,
  shallowRef,
  type ComputedRef,
  type DeepReadonly,
  type Ref,
  type VNodeChild,
} from "vue";

import {
  composeMainLayers,
  composePaneCharts,
  type ExtraComposeFns,
} from "./composeBuiltin";

export type useKlineIndicatorExtra = IndicatorExtraMeta & {
  createChart: (setting: IndicatorSetting) => VNodeChild;
};

export type useKlineIndicatorOptions = {
  defaults?: CreateIndicatorControllerOptions["defaults"];
  extras?: useKlineIndicatorExtra[];
  maPeriods?: number[];
  /** When false, only settings + setters are returned (escape hatch). */
  compose?: boolean;
};

export type useKlineIndicatorResult = {
  settings: DeepReadonly<Ref<IndicatorSettings>>;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (
    id: string,
    params: Record<string, number | number[]>,
  ) => void;
  reset: () => void;
  panelProps: ComputedRef<IndicatorPanelProps>;
  mainLayers: ComputedRef<VNodeChild[]>;
  paneCharts: ComputedRef<VNodeChild[]>;
};

export const useKlineIndicator = (
  options: useKlineIndicatorOptions = {},
): useKlineIndicatorResult => {
  const compose = options.compose !== false;
  const extrasRef = shallowRef(options.extras ?? []);

  const controller = createIndicatorController({
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

  const settings = shallowRef(
    controller.getSnapshot(),
  ) as Ref<IndicatorSettings>;
  const unsubscribe = controller.subscribe(() => {
    settings.value = controller.getSnapshot();
  });
  onScopeDispose(unsubscribe);

  const composed = computed(() => {
    void settings.value;
    extrasRef.value = options.extras ?? [];
    const extraFns: ExtraComposeFns = {};
    for (const extra of extrasRef.value) {
      extraFns[extra.id] = extra.createChart;
    }
    const plan = compose ? controller.getComposePlan() : null;
    return {
      panelProps: controller.getPanelProps(),
      mainLayers: plan ? composeMainLayers(plan, extraFns) : [],
      paneCharts: plan ? composePaneCharts(plan, extraFns) : [],
    };
  });

  return {
    settings: readonly(settings),
    setVisible: controller.setVisible,
    setColor: controller.setColor,
    setParams: controller.setParams,
    reset: controller.reset,
    panelProps: computed(() => composed.value.panelProps),
    mainLayers: computed(() => composed.value.mainLayers),
    paneCharts: computed(() => composed.value.paneCharts),
  };
};
