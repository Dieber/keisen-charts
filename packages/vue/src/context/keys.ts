import type {
  ChartDataState,
  EventBus,
  KeisenState,
  KlineTimezone,
  Resolution,
  Store,
  ThemeInput,
  ThemeMode,
  UpDownScheme,
} from "@keisen-charts/core";
import type { InjectionKey } from "vue";

export type KeisenStore = Store<KeisenState<ChartDataState>>;

export const keisenStoreKey: InjectionKey<KeisenStore> = Symbol("keisenStore");
export const keisenEventBusKey: InjectionKey<EventBus> = Symbol("keisenEventBus");

export type ThemeCallbacks = {
  onThemeChange?: (theme: ThemeInput) => void;
  onModeChange?: (mode: ThemeMode) => void;
  onUpDownChange?: (scheme: UpDownScheme) => void;
};

export type TimezoneCallbacks = {
  onTimezoneChange?: (timezone: KlineTimezone) => void;
};

export type LocaleCallbacks = {
  onLocaleChange?: (localeId: string) => void;
};

export type ResolutionCallbacks = {
  /** 根组件 resolution prop（首屏 meta 未写入前供 hook 回退） */
  resolutionProp?: Resolution;
  onResolutionChange?: (resolution: Resolution) => void;
};

export const themeCallbacksKey: InjectionKey<ThemeCallbacks> =
  Symbol("themeCallbacks");
export const timezoneCallbacksKey: InjectionKey<TimezoneCallbacks> =
  Symbol("timezoneCallbacks");
export const localeCallbacksKey: InjectionKey<LocaleCallbacks> =
  Symbol("localeCallbacks");
export const resolutionCallbacksKey: InjectionKey<ResolutionCallbacks> =
  Symbol("resolutionCallbacks");
