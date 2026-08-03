import type { ILayer } from "../../base/ILayer";
import type { IView } from "../../base/IView";
import type { Unsubscribe } from "../../../store/Store";
import type { Store, KeisenState } from "../../../store/Store";
import { buildMainKlineCrosshairLayerData } from "../../shared/buildCrosshairData";
import { buildMainDataPanelData } from "../../shared/buildDataPanelData";
import { buildLivePriceLayerData } from "../../shared/buildLivePriceData";
import {
  asValueFormatter,
  createPriceFormatter,
  getPriceFormatMinMove,
} from "../../../math/priceFormat";
import { computeAutoPriceDomain } from "../../../math/priceViewport";
import {
  computeBarLayoutFromDomain,
  followLatestIndexDomain,
  shouldFollowLatestOnKlineGrowth,
} from "../../../math/viewport";
import { buildMainKlineGridLayerData } from "../../shared/buildGridLayerData";
import {
  crosshairStyleFromTheme,
  fillThemeBackground,
  gridStyleFromTheme,
} from "../../../theme/themeStyles";
import { CrosshairLayer } from "../../shared/layers/CrosshairLayer";
import { DataPanelLayer } from "../../shared/layers/DataPanelLayer";
import { GridLayer } from "../../shared/layers/GridLayer";
import { DrawingsLayer } from "../../../drawings/DrawingsLayer";
import type {
  ChartDataState,
  MainKlineViewRenderData,
} from "../../../types/kline";
import { BOLLLayer } from "./layers/BOLLLayer";
import { EMALayer } from "./layers/EMALayer";
import { KlineLayer } from "./layers/KlineLayer";
import { LivePriceLayer } from "./layers/LivePriceLayer";
import { MALayer } from "./layers/MALayer";
import { SARLayer } from "./layers/SARLayer";
import { SMMALayer } from "./layers/SMMALayer";
import { isVisiblePriceContributor } from "./layers/visiblePriceExtent";

const getVisibleBarRange = (
  kline: ChartDataState["kline"],
  indexDomain: KeisenState<ChartDataState>["ui"]["indexDomain"],
) => {
  const startBar = Math.max(0, Math.floor(indexDomain.start));
  const endBar = Math.min(kline.length - 1, Math.ceil(indexDomain.end));
  return { startBar, endBar };
};

type MainKlineLayer =
  | GridLayer
  | KlineLayer
  | MALayer
  | EMALayer
  | SMMALayer
  | BOLLLayer
  | SARLayer
  | LivePriceLayer
  | DataPanelLayer
  | CrosshairLayer
  | DrawingsLayer
  | ILayer<CanvasRenderingContext2D, MainKlineViewRenderData>;

export class MainKlineView implements IView {
  private ctx: CanvasRenderingContext2D;
  private store: Store<KeisenState<ChartDataState>>;
  private layers: MainKlineLayer[] = [];
  private frameId: number | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    store: Store<KeisenState<ChartDataState>>,
  ) {
    this.ctx = ctx;
    this.store = store;
    this.init();
    this.bindStore();
  }

  zIndex: number = 1;
  id: string = "MainKlineView";

  init(): void {
    this.addLayer(new GridLayer());
    this.addLayer(new LivePriceLayer());
    this.addLayer(new DataPanelLayer());
    this.addLayer(new DrawingsLayer("main", this.store));
    this.addLayer(new CrosshairLayer());
  }

  addLayer(layer: MainKlineLayer): void {
    this.layers.push(layer);
    if (isVisiblePriceContributor(layer)) {
      this.syncAutoPriceDomain();
    }
    this.requestRender();
  }

  removeLayer(layerId: string): void {
    const prevLength = this.layers.length;
    const removed = this.layers.find((layer) => layer.id === layerId);
    this.layers = this.layers.filter((layer) => layer.id !== layerId);
    if (this.layers.length !== prevLength) {
      if (isVisiblePriceContributor(removed)) {
        this.syncAutoPriceDomain();
      }
      this.requestRender();
    }
  }

  resize(width: number, height: number, _dpr: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.syncViewportSize(width, height);
    this.syncAutoPriceDomain();
    this.requestRender();
  }

  private syncViewportSize(width: number, height: number): void {
    const { ui } = this.store.getState();
    if (ui.viewportWidth === width && ui.viewportHeight === height) return;

    this.store.setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        viewportWidth: width,
        viewportHeight: height,
      },
    }));
  }

  private collectOverlayVisiblePrices(
    kline: ChartDataState["kline"],
    startBar: number,
    endBar: number,
  ): (number | null | undefined)[] {
    const values: (number | null | undefined)[] = [];
    for (const layer of this.layers) {
      if (!isVisiblePriceContributor(layer)) continue;
      for (const value of layer.collectVisiblePrices(kline, startBar, endBar)) {
        values.push(value);
      }
    }
    return values;
  }

  private syncAutoPriceDomain(): void {
    const { data, ui, config } = this.store.getState();
    if (ui.yAxisMode !== "auto") return;

    const { startBar, endBar } = getVisibleBarRange(data.kline, ui.indexDomain);
    const visibleBars =
      startBar <= endBar ? data.kline.slice(startBar, endBar + 1) : [];
    const nextDomain = computeAutoPriceDomain(
      visibleBars,
      config.verticalPaddingRatio,
      this.collectOverlayVisiblePrices(data.kline, startBar, endBar),
    );

    const { min, max } = ui.priceDomain;
    if (min === nextDomain.min && max === nextDomain.max) return;

    this.store.setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        priceDomain: nextDomain,
      },
    }));
  }

  private bindStore(): void {
    this.unsubscribes.push(
      this.store.subscribeSlice(
        (state) => state.data.kline,
        (kline, prevKline) => {
          if (kline.length === prevKline.length) {
            this.syncAutoPriceDomain();
            this.requestRender();
            return;
          }

          const { ui, config } = this.store.getState();
          if (
            shouldFollowLatestOnKlineGrowth(
              kline,
              prevKline,
              ui.indexDomain,
              config.rightOffset,
              ui.viewportWidth,
            )
          ) {
            this.store.setState((prev) => ({
              ...prev,
              ui: {
                ...prev.ui,
                indexDomain: followLatestIndexDomain(
                  prev.ui.indexDomain,
                  kline.length,
                  config.rightOffset,
                  prev.ui.viewportWidth,
                ),
              },
            }));
          }

          this.syncAutoPriceDomain();
          this.requestRender();
        },
      ),
      this.store.subscribeSlice(
        (state) => state.ui.indexDomain,
        () => {
          this.syncAutoPriceDomain();
          this.requestRender();
        },
      ),
      this.store.subscribeSlice(
        (state) => state.ui.viewportWidth,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.viewportHeight,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.priceDomain,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.yAxisMode,
        (mode) => {
          if (mode === "auto") {
            this.syncAutoPriceDomain();
          }
          this.requestRender();
        },
      ),
      this.store.subscribeSlice(
        (state) => state.ui.crosshair,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.drawings,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.resolvedTheme,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.resolvedTimezone,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.resolvedLocale,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.showDataPanel,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.mode,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.priceFormat,
        () => this.requestRender(),
      ),
    );
  }

  private getRenderData(): MainKlineViewRenderData {
    const { data, ui, config } = this.store.getState();
    const theme = config.resolvedTheme;
    const timezone = config.resolvedTimezone.timezone;
    const viewportWidth = this.viewportWidth || ui.viewportWidth;
    const viewportHeight = this.viewportHeight || ui.viewportHeight;
    const priceFormatter = createPriceFormatter(config.priceFormat);
    const formatPrice = asValueFormatter(priceFormatter);
    const minMove = getPriceFormatMinMove(config.priceFormat);

    const grid = buildMainKlineGridLayerData(
      {
        indexDomain: ui.indexDomain,
        priceDomain: ui.priceDomain,
        viewportWidth,
        viewportHeight,
      },
      data.kline,
      {
        timeAxisOptions: { timezone },
        style: gridStyleFromTheme(theme),
        formatLabel: priceFormatter,
        minMove,
      },
    );

    const crosshair = buildMainKlineCrosshairLayerData(
      ui.crosshair,
      ui,
      data.kline,
      viewportWidth,
      viewportHeight,
      crosshairStyleFromTheme(theme),
    );

    const livePrice = buildLivePriceLayerData(
      data.kline,
      ui.priceDomain,
      viewportWidth,
      viewportHeight,
      theme,
    );

    const base: Omit<MainKlineViewRenderData, "dataPanel"> = {
      kline: data.kline,
      bar: computeBarLayoutFromDomain(ui.indexDomain, viewportWidth),
      viewport: {
        indexDomain: ui.indexDomain,
        priceDomain: ui.priceDomain,
        viewportWidth,
        viewportHeight,
      },
      theme,
      formatPrice,
      grid,
      crosshair,
      livePrice,
    };

    const dataPanel = buildMainDataPanelData({
      kline: data.kline,
      crosshair: ui.crosshair,
      theme,
      mode: config.mode,
      viewportWidth,
      viewportHeight,
      layers: this.layers,
      layerData: base,
      showDataPanel: config.showDataPanel,
      formatPrice,
      locale: config.resolvedLocale,
    });

    return { ...base, dataPanel };
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

  render(data: MainKlineViewRenderData, ctx: CanvasRenderingContext2D): void {
    const { viewportWidth, viewportHeight } = data.viewport;
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    fillThemeBackground(ctx, data.theme, viewportWidth, viewportHeight);

    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sortedLayers) {
      if (layer instanceof GridLayer) {
        layer.draw(ctx, data.grid);
      } else if (layer instanceof CrosshairLayer) {
        layer.draw(ctx, data.crosshair);
      } else if (layer instanceof LivePriceLayer) {
        layer.draw(ctx, data.livePrice);
      } else if (layer instanceof DataPanelLayer) {
        layer.draw(ctx, data.dataPanel);
      } else if (layer instanceof DrawingsLayer) {
        layer.draw(ctx, data);
      } else {
        layer.draw(ctx, data);
      }
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
