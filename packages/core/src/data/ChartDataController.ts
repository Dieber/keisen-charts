import { DEFAULT_VISIBLE_BARS } from "../math/viewport";
import type { KeisenState, Store, Unsubscribe } from "../store/Store";
import type { ChartDataState, KlineBar, Resolution } from "../types/kline";
import { createSubscribeEmit } from "./emitKline";
import {
  prependBarsInStore,
  replaceKlineInStore,
  resetIndexDomain,
  resetYAxisForContextSwitch,
  setDataMeta,
} from "./klineMutations";
import { buildCacheKey, resolutionToMs } from "./resolution";
import type { DataContext, GetDataFn, OnSubscribeFn } from "./types";

const LOAD_THRESHOLD = 5;
const COUNT_BACK_BUFFER = 20;

export type ChartDataControllerOptions = {
  data?: KlineBar[];
  getData?: GetDataFn;
  onSubscribe?: OnSubscribeFn;
  resolution?: Resolution;
  symbol?: string;
};

export class ChartDataController {
  private readonly store: Store<KeisenState<ChartDataState>>;
  private options: ChartDataControllerOptions;

  private activeRequestId = 0;
  private loadingHistory = false;
  private hasMoreHistory = true;
  private activeContext: DataContext | null = null;
  private subscriptionCleanup: (() => void) | null = null;
  private prevContextKey: string | null = null;

  private unsubResolution: Unsubscribe | null = null;
  private unsubIndexDomain: Unsubscribe | null = null;

  constructor(
    store: Store<KeisenState<ChartDataState>>,
    options: ChartDataControllerOptions = {},
  ) {
    this.store = store;
    this.options = options;
    this.bindStoreSubscriptions();
    this.syncFromOptions();
  }

  setOptions(options: ChartDataControllerOptions): void {
    const resolutionChanged =
      (options.resolution ?? "1") !== (this.options.resolution ?? "1");
    this.options = options;
    this.bindStoreSubscriptions();
    this.syncFromOptions({ resolutionChanged });
  }

  dispose(): void {
    this.teardownSubscription();
    this.unsubResolution?.();
    this.unsubResolution = null;
    this.unsubIndexDomain?.();
    this.unsubIndexDomain = null;
    this.activeRequestId += 1;
  }

  private get resolution(): Resolution {
    return this.options.resolution ?? "1";
  }

  /**
   * options 同步时的有效周期：
   * - resolution prop 变化 → 以 options 为准（受控）
   * - 仅 symbol 等其它 options 变化 → 保留 store / 当前上下文周期
   *   （避免 hook 切周期后 options 仍是初值，换标的时被打回）
   */
  private resolveResolutionForOptionsSync(
    resolutionChanged: boolean,
  ): Resolution {
    if (resolutionChanged) {
      return this.resolution;
    }
    return (
      this.activeContext?.resolution ??
      this.store.getState().data.meta?.resolution ??
      this.resolution
    );
  }

  private getContext(resolution: Resolution): DataContext {
    return {
      cacheKey: buildCacheKey(resolution, this.options.symbol),
      resolution,
      symbol: this.options.symbol,
    };
  }

  private teardownSubscription(): void {
    this.subscriptionCleanup?.();
    this.subscriptionCleanup = null;
  }

  private bindSubscribe(context: DataContext): void {
    const { onSubscribe } = this.options;
    if (!onSubscribe) return;

    this.teardownSubscription();

    const emit = createSubscribeEmit(
      this.store,
      () => this.activeContext,
      context,
    );

    const cleanup = onSubscribe(
      { resolution: context.resolution, symbol: context.symbol },
      emit,
    );

    this.subscriptionCleanup =
      typeof cleanup === "function" ? cleanup : null;
  }

  private async loadHistory(
    context: DataContext,
    requestId: number,
    params: {
      from?: number;
      to?: number;
      countBack?: number;
    } = {},
  ): Promise<KlineBar[] | null> {
    const { getData } = this.options;
    if (!getData) return null;

    const to = params.to ?? Date.now();
    const countBack =
      params.countBack ?? DEFAULT_VISIBLE_BARS + COUNT_BACK_BUFFER;
    const from =
      params.from ?? to - countBack * resolutionToMs(context.resolution);

    try {
      const bars = await getData({
        resolution: context.resolution,
        symbol: context.symbol,
        from,
        to,
        countBack,
      });

      if (requestId !== this.activeRequestId) {
        return null;
      }

      return bars;
    } catch (error) {
      if (requestId !== this.activeRequestId) {
        return null;
      }

      setDataMeta(this.store, {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async switchContext(context: DataContext): Promise<void> {
    const requestId = ++this.activeRequestId;
    this.activeContext = context;
    this.prevContextKey = context.cacheKey;
    this.hasMoreHistory = true;
    this.loadingHistory = false;

    resetYAxisForContextSwitch(this.store);
    this.teardownSubscription();

    if (!this.options.data?.length) {
      setDataMeta(this.store, {
        resolution: context.resolution,
        symbol: context.symbol,
        status: "loading",
      });
    }

    // Keep old kline + viewport stable while loading (TradingView-like fade).
    // Subscribe only after replace so live ticks cannot mutate the faded series.

    const { getData } = this.options;
    if (!getData) {
      this.bindSubscribe(context);
      return;
    }

    const bars = await this.loadHistory(context, requestId);
    if (!bars || requestId !== this.activeRequestId) {
      return;
    }

    replaceKlineInStore(this.store, bars, {
      resolution: context.resolution,
      symbol: context.symbol,
      status: "ready",
    });
    this.bindSubscribe(context);
  }

  private async loadMoreHistory(context: DataContext): Promise<void> {
    const { getData } = this.options;
    if (!getData || this.loadingHistory || !this.hasMoreHistory) {
      return;
    }

    const kline = this.store.getState().data.kline;
    if (kline.length === 0) return;

    this.loadingHistory = true;
    const requestId = this.activeRequestId;

    const beforeMs = kline[0]!.t;
    const countBack = DEFAULT_VISIBLE_BARS + COUNT_BACK_BUFFER;
    const fromMs = beforeMs - countBack * resolutionToMs(context.resolution);

    try {
      const bars = await getData({
        resolution: context.resolution,
        symbol: context.symbol,
        from: fromMs,
        to: beforeMs,
        countBack,
      });

      if (requestId !== this.activeRequestId) {
        return;
      }

      if (bars.length === 0) {
        this.hasMoreHistory = false;
        return;
      }

      const prependedCount = prependBarsInStore(this.store, bars);
      if (prependedCount <= 0) {
        this.hasMoreHistory = false;
      }
    } finally {
      this.loadingHistory = false;
    }

    // 加载期间可能错过再次触发；prepend 后若仍贴左缘则继续拉
    if (
      requestId === this.activeRequestId &&
      this.hasMoreHistory &&
      this.store.getState().ui.indexDomain.start < LOAD_THRESHOLD
    ) {
      void this.loadMoreHistory(context);
    }
  }

  private syncFromOptions(
    { resolutionChanged }: { resolutionChanged: boolean } = {
      resolutionChanged: true,
    },
  ): void {
    const { data } = this.options;
    const resolution = this.resolveResolutionForOptionsSync(resolutionChanged);

    if (data !== undefined) {
      const context = this.getContext(resolution);
      this.activeContext = context;

      if (this.prevContextKey !== context.cacheKey) {
        resetYAxisForContextSwitch(this.store);
        this.prevContextKey = context.cacheKey;
      }

      replaceKlineInStore(this.store, data, {
        resolution: context.resolution,
        symbol: context.symbol,
        status: "ready",
      });
      resetIndexDomain(this.store);
      this.bindSubscribe(context);
      return;
    }

    void this.switchContext(this.getContext(resolution));
  }

  private bindStoreSubscriptions(): void {
    this.unsubResolution?.();
    this.unsubIndexDomain?.();

    this.unsubResolution = this.store.subscribeSlice(
      (state) => state.data.meta?.resolution,
      (resolution, prevResolution) => {
        if (this.options.data !== undefined) return;
        if (!resolution || resolution === prevResolution) return;

        const context = this.getContext(resolution);
        if (this.activeContext?.cacheKey === context.cacheKey) {
          return;
        }

        void this.switchContext(context);
      },
    );

    this.unsubIndexDomain = this.store.subscribeSlice(
      (state) => state.ui.indexDomain,
      (indexDomain) => {
        const context = this.activeContext;
        if (!context || indexDomain.start >= LOAD_THRESHOLD) {
          return;
        }
        void this.loadMoreHistory(context);
      },
    );
  }
}
