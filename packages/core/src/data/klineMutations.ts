import {
  computeAutoPriceDomain,
  DEFAULT_VERTICAL_PADDING_RATIO,
} from "../math/priceViewport";
import {
  computeInitialIndexDomain,
  DEFAULT_RIGHT_OFFSET,
  followLatestIndexDomain,
  wasFollowingLatest,
} from "../math/viewport";
import { remapDrawingsAfterPrepend } from "../drawings/anchor";
import type { KeisenState, Store } from "../store/Store";
import type { ChartDataState, KlineBar } from "../types/kline";

const getVisibleBars = (
  kline: KlineBar[],
  indexDomain: KeisenState<ChartDataState>["ui"]["indexDomain"],
) => {
  const startBar = Math.max(0, Math.floor(indexDomain.start));
  const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));
  return kline.slice(startBar, endBar + 1);
};

const syncDomainsForKline = (
  prev: KeisenState<ChartDataState>,
  kline: KlineBar[],
  indexDomain: KeisenState<ChartDataState>["ui"]["indexDomain"],
  paddingRatio = prev.config.verticalPaddingRatio,
): KeisenState<ChartDataState>["ui"] => {
  const visibleBars = getVisibleBars(kline, indexDomain);
  return {
    ...prev.ui,
    indexDomain,
    priceDomain:
      prev.ui.yAxisMode === "auto"
        ? computeAutoPriceDomain(visibleBars, paddingRatio)
        : prev.ui.priceDomain,
  };
};

/** 切换周期 / 币种时，主图 Y 轴回归 auto 与默认上下边距 */
export const resetYAxisForContextSwitch = (
  store: Store<KeisenState<ChartDataState>>,
): void => {
  store.setState((prev) => {
    if (
      prev.ui.yAxisMode === "auto" &&
      prev.config.verticalPaddingRatio === DEFAULT_VERTICAL_PADDING_RATIO
    ) {
      return prev;
    }

    return {
      ...prev,
      config: {
        ...prev.config,
        verticalPaddingRatio: DEFAULT_VERTICAL_PADDING_RATIO,
      },
      ui: {
        ...prev.ui,
        yAxisMode: "auto",
      },
    };
  });
};

export const resetIndexDomain = (
  store: Store<KeisenState<ChartDataState>>,
): void => {
  store.setState((prev) => {
    const indexDomain = computeInitialIndexDomain(
      prev.data.kline.length,
      prev.ui.viewportWidth,
      prev.config.rightOffset ?? DEFAULT_RIGHT_OFFSET,
    );
    return {
      ...prev,
      ui: syncDomainsForKline(prev, prev.data.kline, indexDomain),
    };
  });
};

export const replaceKlineInStore = (
  store: Store<KeisenState<ChartDataState>>,
  bars: KlineBar[],
  metaPatch?: Partial<NonNullable<ChartDataState["meta"]>>,
): void => {
  store.setState((prev) => {
    const indexDomain = computeInitialIndexDomain(
      bars.length,
      prev.ui.viewportWidth,
      prev.config.rightOffset ?? DEFAULT_RIGHT_OFFSET,
    );
    return {
      ...prev,
      data: {
        ...prev.data,
        kline: bars,
        meta: {
          ...prev.data.meta,
          status: "ready",
          ...metaPatch,
        },
      },
      ui: syncDomainsForKline(prev, bars, indexDomain),
    };
  });
};

export const prependBarsInStore = (
  store: Store<KeisenState<ChartDataState>>,
  incoming: KlineBar[],
): number => {
  let prependedCount = 0;

  store.setState((prev) => {
    const existing = prev.data.kline;
    if (existing.length === 0 || incoming.length === 0) {
      return prev;
    }

    const existingFirstT = existing[0]!.t;
    const filtered = incoming.filter((bar) => bar.t < existingFirstT);
    if (filtered.length === 0) {
      return prev;
    }

    const merged = [...filtered, ...existing];
    const deduped: KlineBar[] = [];
    const seen = new Set<number>();
    for (const bar of merged) {
      if (seen.has(bar.t)) continue;
      seen.add(bar.t);
      deduped.push(bar);
    }

    prependedCount = deduped.length - existing.length;
    if (prependedCount <= 0) {
      return prev;
    }

    const indexDomain = {
      start: prev.ui.indexDomain.start + prependedCount,
      end: prev.ui.indexDomain.end + prependedCount,
    };

    return {
      ...prev,
      data: {
        ...prev.data,
        kline: deduped,
      },
      ui: {
        ...syncDomainsForKline(prev, deduped, indexDomain),
        drawings: remapDrawingsAfterPrepend(
          prev.ui.drawings,
          deduped,
          prependedCount,
        ),
      },
    };
  });

  return prependedCount;
};

export const appendBarInStore = (
  store: Store<KeisenState<ChartDataState>>,
  bar: KlineBar,
): void => {
  store.setState((prev) => {
    const kline = [...prev.data.kline, bar];
    const { ui, config } = prev;
    const indexDomain = wasFollowingLatest(
      ui.indexDomain,
      prev.data.kline.length,
      config.rightOffset,
      ui.viewportWidth,
    )
      ? followLatestIndexDomain(
          ui.indexDomain,
          kline.length,
          config.rightOffset,
          ui.viewportWidth,
        )
      : ui.indexDomain;

    return {
      ...prev,
      data: { ...prev.data, kline },
      ui: syncDomainsForKline(prev, kline, indexDomain),
    };
  });
};

export const updateLastBarInStore = (
  store: Store<KeisenState<ChartDataState>>,
  bar: KlineBar,
): void => {
  store.setState((prev) => {
    if (prev.data.kline.length === 0) {
      return prev;
    }

    const kline = [...prev.data.kline];
    kline[kline.length - 1] = bar;

    return {
      ...prev,
      data: { ...prev.data, kline },
      ui: syncDomainsForKline(prev, kline, prev.ui.indexDomain),
    };
  });
};

export const setDataMeta = (
  store: Store<KeisenState<ChartDataState>>,
  metaPatch: Partial<NonNullable<ChartDataState["meta"]>>,
): void => {
  store.setState((prev) => ({
    ...prev,
    data: {
      ...prev.data,
      meta: {
        status: prev.data.meta?.status ?? "idle",
        ...prev.data.meta,
        ...metaPatch,
      },
    },
  }));
};
