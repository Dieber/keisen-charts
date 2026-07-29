import { createEmptyDrawingsState } from "../drawings/types";
import { DEFAULT_PRICE_FORMAT } from "../math/priceFormat";
import {
  computeAutoPriceDomain,
  DEFAULT_VERTICAL_PADDING_RATIO,
} from "../math/priceViewport";
import {
  computeInitialIndexDomain,
  DEFAULT_RIGHT_OFFSET,
} from "../math/viewport";
import { resolveLocale } from "../locale/resolveLocale";
import { resolveThemeConfig } from "../theme/resolveTheme";
import { resolveTimezone } from "../time/resolveTimezone";
import type { ChartDataState, KlineBar } from "../types/kline";
import { createStore, type KeisenState, type Store } from "./Store";

export const DEFAULT_VIEWPORT_WIDTH = 1000;
export const DEFAULT_VIEWPORT_HEIGHT = 500;
export const DEFAULT_VOLUME_VIEWPORT_HEIGHT = 120;
export const DEFAULT_MACD_VIEWPORT_HEIGHT = 120;
export const DEFAULT_INDICATOR_VIEWPORT_HEIGHT = 120;

export type CreateInitialKeisenStateOptions = {
  kline?: KlineBar[];
};

const getInitialVisibleBars = (
  kline: KlineBar[],
  indexDomain: ReturnType<typeof computeInitialIndexDomain>,
) => {
  const startBar = Math.max(0, Math.floor(indexDomain.start));
  const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));
  return kline.slice(startBar, endBar + 1);
};

export const createInitialKeisenState = (
  options: CreateInitialKeisenStateOptions = {},
): KeisenState<ChartDataState> => {
  const kline = options.kline ?? [];
  const indexDomain = computeInitialIndexDomain(
    kline.length,
    DEFAULT_VIEWPORT_WIDTH,
    DEFAULT_RIGHT_OFFSET,
  );
  const visibleBars = getInitialVisibleBars(kline, indexDomain);

  const themeConfig = resolveThemeConfig(undefined, "dark", "green-up");
  const timezoneConfig = resolveTimezone();
  const localeConfig = resolveLocale();

  return {
    config: {
      themeId: themeConfig.themeId,
      themeDefinition: themeConfig.themeDefinition,
      themeOverrides: themeConfig.themeOverrides,
      mode: themeConfig.mode,
      upDown: themeConfig.upDown,
      resolvedTheme: themeConfig.resolvedTheme,
      timezone: timezoneConfig.timezone,
      resolvedTimezone: timezoneConfig,
      localeId: localeConfig.localeId,
      resolvedLocale: localeConfig.resolvedLocale,
      rightOffset: DEFAULT_RIGHT_OFFSET,
      verticalPaddingRatio: DEFAULT_VERTICAL_PADDING_RATIO,
      showDataPanel: true,
      priceFormat: DEFAULT_PRICE_FORMAT,
    },
    ui: {
      charts: {
        main: { id: "main", show: true },
        volume: { id: "volume", show: true },
        macd: { id: "macd", show: true },
        rsi: { id: "rsi", show: true },
        kdj: { id: "kdj", show: true },
        obv: { id: "obv", show: true },
        cci: { id: "cci", show: true },
        wr: { id: "wr", show: true },
        dmi: { id: "dmi", show: true },
        mtm: { id: "mtm", show: true },
      },
      indexDomain,
      viewportWidth: DEFAULT_VIEWPORT_WIDTH,
      viewportHeight: DEFAULT_VIEWPORT_HEIGHT,
      priceDomain: computeAutoPriceDomain(
        visibleBars,
        DEFAULT_VERTICAL_PADDING_RATIO,
      ),
      yAxisMode: "auto",
      panes: {
        macd: {
          domain: { min: -1, max: 1 },
          viewportHeight: DEFAULT_MACD_VIEWPORT_HEIGHT,
          yAxisMode: "auto",
        },
      },
      crosshair: null,
      drawings: createEmptyDrawingsState(),
    },
    data: {
      kline,
      meta: { status: kline.length > 0 ? "ready" : "idle" },
    },
  };
};

export const createKeisenStore = (
  options: CreateInitialKeisenStateOptions = {},
): Store<KeisenState<ChartDataState>> =>
  createStore(createInitialKeisenState(options));
