import type { DrawingsState } from "../drawings/types";
import type { LocaleMessages } from "../locale/types";
import type { PriceFormat } from "../math/priceFormat";
import type {
  ResolvedThemeTokens,
  ThemeDefinition,
  ThemeMode,
  ThemeTokens,
  UpDownScheme,
} from "../theme/types";
import type { KlineTimezone, ResolvedTimezoneConfig } from "../time/types";

export type Unsubscribe = () => void;

/**
 * 图表状态
 */
export type ChartState = {
  id: string;
  show: boolean;
};

/**
 * X 轴视口：连续的数据数组下标区间（浮点数以支持平滑拖拽）。
 * start/end 分别对应屏幕左/右边缘的 bar 索引；end 可超出 kline.length-1 表示右边留白。
 */
export type IndexDomain = {
  start: number;
  end: number;
};

/**
 * Y 轴视口：连续价格区间。
 * min 对应屏幕下边缘，max 对应屏幕上边缘（Canvas Y 向下）。
 */
export type PriceDomain = {
  min: number;
  max: number;
};

export type YAxisMode = "auto" | "manual";

/** 图表槽位：主图 + 成交量 + 指标副图（内置） */
export type ChartSlotId =
  | "main"
  | "volume"
  | "macd"
  | "rsi"
  | "kdj"
  | "obv"
  | "cci"
  | "wr"
  | "dmi"
  | "mtm";

/** 十字线可来源的 view（main 或任意 paneId） */
export type CrosshairSourceViewId = string;

/** 副图 / 成交量 pane 的 Y 域与高度 SSOT */
export type PaneViewportState = {
  domain: PriceDomain;
  viewportHeight: number;
  yAxisMode: YAxisMode;
};

/** 十字线 SSOT：语义坐标，非像素坐标 */
export type CrosshairState = {
  /** 吸附到最近整数 bar 的索引 */
  barIndex: number;
  /** 触发十字线的来源 view（决定横线取值域） */
  sourceViewId: CrosshairSourceViewId;
  /** 来源 pane 内的本地 y（仅用于反算 price / volume / 指标值） */
  localY: number;
} | null;

/**
 * UI 状态（视口、缩放、图表显隐等）
 */
export type UiState = {
  charts: Partial<Record<string, ChartState>> &
    Record<"main" | "volume" | "macd", ChartState>;
  indexDomain: IndexDomain;
  /** 主图逻辑视口像素宽，供 controller clamp / zoom 与跨 pane 坐标对齐 */
  viewportWidth: number;
  /** 主图逻辑视口像素高，供 Y 轴坐标换算与跨 pane 对齐 */
  viewportHeight: number;
  /** Y 轴 SSOT：可见价格区间 */
  priceDomain: PriceDomain;
  /**
   * auto：跟随可见 K 线极值；
   * manual（自由画布）：用户滚轮/拖拽后由 controller 控制 priceDomain。
   */
  yAxisMode: YAxisMode;
  /** 副图 / 成交量 pane 视口（volume、macd、rsi…） */
  panes: Record<string, PaneViewportState>;
  /** 十字线会话级交互状态 */
  crosshair: CrosshairState;
  /** 画线工具 SSOT：图形数据 + 放置会话 */
  drawings: DrawingsState;
};

export type ChartConfig = {
  themeId: string;
  /** 当前皮肤定义（preset 快照或自定义） */
  themeDefinition: ThemeDefinition;
  /** 浅合并到当前 mode token 之上 */
  themeOverrides?: Partial<ThemeTokens>;
  /** 当前主题模式（light / dark） */
  mode: ThemeMode;
  /** 涨跌色方案 */
  upDown: UpDownScheme;
  /** 已解析色板，Layer / builder 直接读 */
  resolvedTheme: ResolvedThemeTokens;
  /** 用户意图时区；默认 "local" */
  timezone: KlineTimezone;
  /** 已解析时区，Layer / builder 直接读 */
  resolvedTimezone: ResolvedTimezoneConfig;
  /** 当前文案 locale id；默认 zh-CN */
  localeId: string;
  /** 已解析文案表，Layer / builder 直接读 */
  resolvedLocale: LocaleMessages;
  /** 最新 K 线与画布右边缘的默认留白（像素） */
  rightOffset: number;
  /** auto 模式下 Y 轴上下留白比例 */
  verticalPaddingRatio: number;
  /** 是否显示主图 / 副图左上角信息面板，默认 true */
  showDataPanel: boolean;
  /** 主图价格格式（Y 轴 / 网格 / 十字线 / OHLC / legend） */
  priceFormat: PriceFormat;
};

// store不应该存放layer，view，pane这种直观等数据，应该只保留必要的 Single Source of Truth以供订阅者使用。

export type KeisenState<
  TData extends Record<string, unknown> = Record<string, unknown>,
> = {
  config: ChartConfig; // 图表配置
  ui: UiState; // UI 状态
  data: TData; // 图表数据
};

export type StoreListener<TState> = (state: TState, prevState: TState) => void;

const isDev =
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

const formatStateForDevLog = (state: unknown): unknown => {
  if (typeof state !== "object" || state === null) return state;

  const record = state as Record<string, unknown>;
  const data = record.data;

  if (typeof data !== "object" || data === null || !("kline" in data)) {
    return state;
  }

  const kline = (data as { kline: unknown }).kline;
  if (!Array.isArray(kline)) return state;

  return {
    ...record,
    data: {
      ...(data as Record<string, unknown>),
      kline: `KlineBar[${kline.length}]`,
    },
  };
};

const logStateChange = (state: unknown) => {
  if (!isDev) return;
  console.log("[KeisenStore]", formatStateForDevLog(state));
};

export type Store<TState> = {
  getState: () => TState;
  setState: (updater: TState | ((prev: TState) => TState)) => void;
  subscribe: (listener: StoreListener<TState>) => Unsubscribe;
  subscribeSlice: <TSlice>(
    selector: (state: TState) => TSlice,
    listener: (slice: TSlice, prevSlice: TSlice) => void,
    equals?: (a: TSlice, b: TSlice) => boolean,
  ) => Unsubscribe;
};

export function createStore<TState>(initialState: TState): Store<TState> {
  let state = initialState;
  const listeners = new Set<StoreListener<TState>>();
  const sliceListeners = new Set<{
    selector: (state: TState) => unknown;
    listener: (slice: unknown, prevSlice: unknown) => void;
    prevSlice: unknown;
    equals: (a: unknown, b: unknown) => boolean;
  }>();

  const notify = (prevState: TState) => {
    for (const listener of listeners) {
      listener(state, prevState);
    }

    for (const entry of sliceListeners) {
      const nextSlice = entry.selector(state);
      if (!entry.equals(nextSlice, entry.prevSlice)) {
        const prevSlice = entry.prevSlice;
        entry.prevSlice = nextSlice;
        entry.listener(nextSlice, prevSlice);
      }
    }
  };

  return {
    getState: () => state,

    setState: (updater) => {
      const prevState = state;
      state =
        typeof updater === "function"
          ? (updater as (prev: TState) => TState)(prevState)
          : updater;
      // logStateChange(state);
      notify(prevState);
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    subscribeSlice: (selector, listener, equals = Object.is) => {
      const entry = {
        selector,
        listener: listener as (slice: unknown, prevSlice: unknown) => void,
        prevSlice: selector(state),
        equals: equals as (a: unknown, b: unknown) => boolean,
      };

      sliceListeners.add(entry);

      return () => sliceListeners.delete(entry);
    },
  };
}

const DEFAULT_PANE: PaneViewportState = {
  domain: { min: 0, max: 1 },
  viewportHeight: 120,
  yAxisMode: "auto",
};

/** 读取 pane；不存在时返回默认值（不写入 store） */
export const getPane = (
  ui: UiState,
  paneId: string,
  fallback: PaneViewportState = DEFAULT_PANE,
): PaneViewportState => ui.panes[paneId] ?? fallback;

/** 合并写入单个 pane */
export const patchPane = (
  ui: UiState,
  paneId: string,
  patch: Partial<PaneViewportState>,
  fallback: PaneViewportState = DEFAULT_PANE,
): UiState => {
  const prev = ui.panes[paneId] ?? fallback;
  return {
    ...ui,
    panes: {
      ...ui.panes,
      [paneId]: { ...prev, ...patch },
    },
  };
};
