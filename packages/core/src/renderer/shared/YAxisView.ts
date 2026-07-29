import type { IView } from "../base/IView";
import { getPane, type Unsubscribe } from "../../store/Store";
import type {
  KeisenState,
  PriceDomain,
  Store,
  CrosshairSourceViewId,
} from "../../store/Store";
import { buildYAxisCrosshairLabel } from "./buildCrosshairData";
import { buildLivePriceYAxisLabel } from "./buildLivePriceData";
import {
  asValueFormatter,
  createPriceFormatter,
  getPriceFormatMinMove,
  type PriceFormatter,
} from "../../math/priceFormat";
import { formatIndicatorTick } from "../../math/indicatorViewport";
import {
  fillThemeBackground,
  strokeAxisTopEdge,
} from "../../theme/themeStyles";
import type { ChartDataState, YAxisLayerData } from "../../types/kline";
import { CrosshairYAxisLabelLayer } from "./layers/CrosshairYAxisLabelLayer";
import { LivePriceYAxisLabelLayer } from "./layers/LivePriceYAxisLabelLayer";
import { buildYAxisLayerData, YAxisLayer } from "./layers/YAxisLayer";

export type YAxisViewConfig = {
  id: string;
  sourceViewId: CrosshairSourceViewId;
  selectDomain: (state: KeisenState<ChartDataState>) => PriceDomain;
  selectViewportHeight: (state: KeisenState<ChartDataState>) => number;
  /**
   * 自定义刻度 formatter。主图省略时从 `config.priceFormat` 派生。
   */
  formatTick?: PriceFormatter;
  /** 仅主图 Y 轴显示最新价高亮 */
  showLivePrice?: boolean;
  /** 为 true 时从 store.config.priceFormat 读取（主图） */
  usePriceFormatConfig?: boolean;
  /** 副图 Y 轴顶部分隔线 */
  drawTopBorder?: boolean;
};

type YAxisViewLayer =
  | YAxisLayer
  | CrosshairYAxisLabelLayer
  | LivePriceYAxisLabelLayer;

export class YAxisView implements IView {
  private ctx: CanvasRenderingContext2D;
  private store: Store<KeisenState<ChartDataState>>;
  private config: YAxisViewConfig;
  private layers: YAxisViewLayer[] = [];
  private frameId: number | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private viewportHeight = 0;
  private axisWidth = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    store: Store<KeisenState<ChartDataState>>,
    config: YAxisViewConfig,
  ) {
    this.ctx = ctx;
    this.store = store;
    this.config = config;
    this.id = config.id;
    this.init();
    this.bindStore();
  }

  zIndex: number = 1;
  id: string;

  init(): void {
    this.addLayer(new YAxisLayer());
    if (this.config.showLivePrice) {
      this.addLayer(new LivePriceYAxisLabelLayer());
    }
    this.addLayer(new CrosshairYAxisLabelLayer());
  }

  addLayer(layer: YAxisViewLayer): void {
    this.layers.push(layer);
  }

  removeLayer(layerId: string): void {
    this.layers = this.layers.filter((layer) => layer.id !== layerId);
  }

  resize(width: number, height: number, _dpr: number): void {
    this.axisWidth = width;
    this.viewportHeight = height;
    this.requestRender();
  }

  private resolveFormatTick(
    state: KeisenState<ChartDataState>,
  ): { formatTick: PriceFormatter; minMove?: number } {
    if (this.config.formatTick) {
      return { formatTick: this.config.formatTick };
    }
    if (this.config.usePriceFormatConfig) {
      const priceFormat = state.config.priceFormat;
      return {
        formatTick: createPriceFormatter(priceFormat),
        minMove: getPriceFormatMinMove(priceFormat),
      };
    }
    return { formatTick: formatIndicatorTick };
  }

  private bindStore(): void {
    this.unsubscribes.push(
      this.store.subscribeSlice(
        (state) => this.config.selectDomain(state),
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => this.config.selectViewportHeight(state),
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.crosshair,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.data.kline,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.resolvedTheme,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.priceFormat,
        () => this.requestRender(),
      ),
    );
  }

  private getRenderData(): YAxisLayerData {
    const state = this.store.getState();
    const theme = state.config.resolvedTheme;
    const domain = this.config.selectDomain(state);
    const storeHeight = this.config.selectViewportHeight(state);
    const viewportHeight = this.viewportHeight || storeHeight;
    const axisWidth = this.axisWidth || state.ui.viewportWidth;
    const { formatTick, minMove } = this.resolveFormatTick(state);
    const formatValue = asValueFormatter(formatTick);
    const crosshairLabel = buildYAxisCrosshairLabel(
      state.ui.crosshair,
      state.data.kline,
      domain,
      this.config.sourceViewId,
      formatValue,
      axisWidth,
      viewportHeight,
      theme,
    );
    const livePriceLabel = this.config.showLivePrice
      ? buildLivePriceYAxisLabel(
          state.data.kline,
          domain,
          axisWidth,
          viewportHeight,
          theme,
          formatValue,
        )
      : null;

    return buildYAxisLayerData(
      domain,
      viewportHeight,
      axisWidth,
      formatTick,
      theme,
      crosshairLabel,
      livePriceLabel,
      minMove,
    );
  }

  requestRender(): void {
    if (this.frameId !== null) return;

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.render(this.getRenderData(), this.ctx);
    });
  }

  flushRender(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.render(this.getRenderData(), this.ctx);
  }

  render(data: YAxisLayerData, ctx: CanvasRenderingContext2D): void {
    const width = this.axisWidth || ctx.canvas.width;
    const height = data.viewport.viewportHeight;
    ctx.clearRect(0, 0, width, height);
    fillThemeBackground(ctx, data.theme, width, height);
    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sortedLayers) {
      if (layer instanceof CrosshairYAxisLabelLayer) {
        layer.draw(ctx, data.crosshairLabel);
      } else if (layer instanceof LivePriceYAxisLabelLayer) {
        layer.draw(ctx, data.livePriceLabel);
      } else {
        layer.draw(ctx, data);
      }
    }
    if (this.config.drawTopBorder) {
      strokeAxisTopEdge(ctx, data.theme, width);
    }
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
    this.unsubscribes = [];

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
}

export const klineYAxisConfig: YAxisViewConfig = {
  id: "MainKlineYAxisView",
  sourceViewId: "main",
  selectDomain: (state) => state.ui.priceDomain,
  selectViewportHeight: (state) => state.ui.viewportHeight,
  usePriceFormatConfig: true,
  showLivePrice: true,
};

export const createPaneYAxisConfig = (
  paneId: string,
  options?: {
    id?: string;
    formatTick?: PriceFormatter;
  },
): YAxisViewConfig => ({
  id: options?.id ?? `PaneYAxisView-${paneId}`,
  sourceViewId: paneId,
  selectDomain: (state) => getPane(state.ui, paneId).domain,
  selectViewportHeight: (state) => getPane(state.ui, paneId).viewportHeight,
  formatTick: options?.formatTick ?? formatIndicatorTick,
  drawTopBorder: true,
});
