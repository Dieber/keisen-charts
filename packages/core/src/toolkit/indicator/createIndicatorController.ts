import {
  buildIndicatorGroups,
  getBuiltinIndicatorMetas,
  getDefaultIndicatorSettings,
} from "./builtinMetas";
import {
  DEFAULT_MA_PERIODS,
  resolveIndicatorComposePlan,
} from "./composePlan";
import { paletteColorAt } from "./panelHelpers";
import type {
  IndicatorComposePlan,
  IndicatorExtraMeta,
  IndicatorPanelProps,
  IndicatorSetting,
  IndicatorSettings,
} from "./types";

export type CreateIndicatorControllerOptions = {
  defaults?: Partial<Record<string, Partial<IndicatorSetting>>>;
  extras?: IndicatorExtraMeta[];
  maPeriods?: number[];
};

export type IndicatorController = {
  getSnapshot: () => IndicatorSettings;
  subscribe: (listener: () => void) => () => void;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (
    id: string,
    params: Record<string, number | number[]>,
  ) => void;
  reset: () => void;
  getPanelProps: () => IndicatorPanelProps;
  getComposePlan: () => IndicatorComposePlan;
  getGroups: () => IndicatorPanelProps["groups"];
};

const cloneParams = (
  params?: Record<string, number | number[]>,
): Record<string, number | number[]> | undefined => {
  if (!params) return undefined;
  const next: Record<string, number | number[]> = {};
  for (const [key, value] of Object.entries(params)) {
    next[key] = Array.isArray(value) ? [...value] : value;
  }
  return next;
};

const cloneSetting = (setting: IndicatorSetting): IndicatorSetting => ({
  visible: setting.visible,
  colors: { ...setting.colors },
  ...(setting.params ? { params: cloneParams(setting.params) } : {}),
});

const cloneSettings = (settings: IndicatorSettings): IndicatorSettings => {
  const next: IndicatorSettings = {};
  for (const [id, setting] of Object.entries(settings)) {
    next[id] = cloneSetting(setting);
  }
  return next;
};

const mergeDefaults = (
  base: IndicatorSettings,
  defaults?: CreateIndicatorControllerOptions["defaults"],
): IndicatorSettings => {
  if (!defaults) return base;
  const next = cloneSettings(base);
  for (const [id, partial] of Object.entries(defaults)) {
    if (!partial) continue;
    const current = next[id] ?? { visible: false, colors: {} };
    next[id] = {
      visible: partial.visible ?? current.visible,
      colors: { ...current.colors, ...partial.colors },
      params:
        partial.params !== undefined
          ? cloneParams(partial.params)
          : current.params
            ? cloneParams(current.params)
            : undefined,
    };
  }
  return next;
};

const maColorsForPeriods = (
  periods: number[],
  existing: Record<string, string> = {},
): Record<string, string> => {
  const colors: Record<string, string> = {};
  periods.forEach((period, index) => {
    const key = `ma${period}`;
    colors[key] = existing[key] ?? paletteColorAt(index);
  });
  return colors;
};

export const createIndicatorController = (
  options: CreateIndicatorControllerOptions = {},
): IndicatorController => {
  const builtins = getBuiltinIndicatorMetas();
  const extras = options.extras ?? [];
  const maPeriods = options.maPeriods ?? [...DEFAULT_MA_PERIODS];

  let settings = getDefaultIndicatorSettings();
  if (options.maPeriods) {
    const ma = settings.ma ?? { visible: true, colors: {} };
    settings = {
      ...settings,
      ma: {
        ...ma,
        colors: maColorsForPeriods(maPeriods, ma.colors),
        params: { ...ma.params, periods: [...maPeriods] },
      },
    };
  }
  for (const extra of extras) {
    settings[extra.id] = cloneSetting(
      extra.defaultSetting ?? {
        visible: false,
        colors: Object.fromEntries(
          Object.keys(extra.meta.colorLabels).map((key) => [key, "#888888"]),
        ),
      },
    );
  }
  settings = mergeDefaults(settings, options.defaults);
  const defaultsSnapshot = cloneSettings(settings);
  let snapshot = cloneSettings(settings);

  const listeners = new Set<() => void>();

  const commit = (next: IndicatorSettings) => {
    settings = next;
    snapshot = cloneSettings(settings);
    for (const listener of listeners) listener();
  };

  const ensureSetting = (id: string): IndicatorSetting => {
    const existing = settings[id];
    if (existing) return existing;
    const created: IndicatorSetting = { visible: false, colors: {} };
    settings = { ...settings, [id]: created };
    return created;
  };

  const setVisible = (id: string, visible: boolean) => {
    const current = ensureSetting(id);
    if (current.visible === visible) return;
    commit({
      ...settings,
      [id]: { ...cloneSetting(current), visible },
    });
  };

  const setColor = (id: string, key: string, color: string) => {
    const current = ensureSetting(id);
    if (current.colors[key] === color) return;
    commit({
      ...settings,
      [id]: {
        ...cloneSetting(current),
        colors: { ...current.colors, [key]: color },
      },
    });
  };

  const setParams = (
    id: string,
    params: Record<string, number | number[]>,
  ) => {
    const current = ensureSetting(id);
    commit({
      ...settings,
      [id]: {
        ...cloneSetting(current),
        params: {
          ...cloneParams(current.params),
          ...cloneParams(params),
        },
      },
    });
  };

  const reset = () => {
    commit(cloneSettings(defaultsSnapshot));
  };

  const getGroups = () =>
    buildIndicatorGroups([
      ...builtins.map((meta) => ({
        id: meta.id,
        label: meta.label,
        group: meta.group,
        colorLabels: meta.colorLabels,
        paramFields: meta.paramFields,
      })),
      ...extras.map((extra) => ({
        id: extra.id,
        label: extra.meta.label,
        group: extra.meta.group,
        colorLabels: extra.meta.colorLabels,
        paramFields: extra.meta.paramFields,
      })),
    ]);

  const getPanelProps = (): IndicatorPanelProps => ({
    groups: getGroups(),
    settings: snapshot,
    setVisible,
    setColor,
    setParams,
    reset,
  });

  const getComposePlan = () =>
    resolveIndicatorComposePlan(settings, { maPeriods, extras });

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setVisible,
    setColor,
    setParams,
    reset,
    getPanelProps,
    getComposePlan,
    getGroups,
  };
};
