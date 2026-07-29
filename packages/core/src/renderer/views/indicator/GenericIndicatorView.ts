import type { ILayer } from "../../base/ILayer";
import type { IView } from "../../base/IView";
import type { Unsubscribe } from "../../../store/Store";
import type { Store, KeisenState } from "../../../store/Store";
import { getPane, patchPane } from "../../../store/Store";
import type { IndicatorDescriptor, IndicatorCalcParams, IndicatorResult } from "../../../indicators/types";
import {
  collectIndicatorVisibleValues,
  computeAutoIndicatorDomain,
} from "../../../math/indicatorDomain";
import { formatIndicatorTick } from "../../../math/indicatorViewport";
import { fromSimpleFormatter } from "../../../math/priceFormat";
import {
  computeBarLayoutFromDomain,
  followLatestIndexDomain,
  shouldFollowLatestOnKlineGrowth,
} from "../../../math/viewport";
import { buildPaneCrosshairLayerData } from "../../shared/buildCrosshairData";
import { buildIndicatorDataPanelData } from "../../shared/buildDataPanelData";
import { buildPaneGridLayerData } from "../../shared/buildGridLayerData";
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
  MainIndicatorViewRenderData,
} from "../../../types/kline";
import { IndicatorBarLayer } from "./layers/IndicatorBarLayer";
import { IndicatorLineLayer } from "./layers/IndicatorLineLayer";
import { DEFAULT_INDICATOR_VIEWPORT_HEIGHT } from "../../../store/createKeisenStore";

type IndicatorLayer =
  | GridLayer
  | CrosshairLayer
  | DataPanelLayer
  | DrawingsLayer
  | IndicatorLineLayer
  | IndicatorBarLayer
  | ILayer<CanvasRenderingContext2D, MainIndicatorViewRenderData>;

export type GenericIndicatorViewOptions = {
  paneId: string;
  descriptor: IndicatorDescriptor;
};

const stableParamsKey = (params: IndicatorCalcParams): string =>
  JSON.stringify(params);

export class GenericIndicatorView implements IView {
  private ctx: CanvasRenderingContext2D;
  private store: Store<KeisenState<ChartDataState>>;
  private paneId: string;
  private descriptor: IndicatorDescriptor;
  private calcParams: IndicatorCalcParams;
  private layers: IndicatorLayer[] = [];
  private frameId: number | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private viewportWidth = 0;
  private viewportHeight = 0;

  private cachedKline: ChartDataState["kline"] | null = null;
  private cachedParamsKey = "";
  private cachedResult: IndicatorResult = {};

  constructor(
    ctx: CanvasRenderingContext2D,
    store: Store<KeisenState<ChartDataState>>,
    options: GenericIndicatorViewOptions,
  ) {
    this.ctx = ctx;
    this.store = store;
    this.paneId = options.paneId;
    this.descriptor = options.descriptor;
    this.calcParams = options.descriptor.calcParams;
    this.id = `GenericIndicatorView-${options.paneId}`;
    this.ensurePaneExists();
    this.init();
    this.bindStore();
  }

  zIndex: number = 1;
  id: string;

  private ensurePaneExists(): void {
    const { ui } = this.store.getState();
    if (ui.panes[this.paneId]) return;
    this.store.setState((prev) => ({
      ...prev,
      ui: patchPane(
        prev.ui,
        this.paneId,
        {},
        {
          domain: this.descriptor.fixedYDomain ?? { min: -1, max: 1 },
          viewportHeight: DEFAULT_INDICATOR_VIEWPORT_HEIGHT,
          yAxisMode: "auto",
        },
      ),
    }));
  }

  init(): void {
    this.addLayer(new GridLayer());
    this.addLayer(new DataPanelLayer());
    this.addLayer(new DrawingsLayer(this.paneId, this.store));
    this.addLayer(new CrosshairLayer());
  }

  setCalcParams(params: IndicatorCalcParams): void {
    if (stableParamsKey(params) === stableParamsKey(this.calcParams)) return;
    this.calcParams = params;
    this.cachedParamsKey = "";
    this.cachedKline = null;
    this.syncAutoDomain();
    this.requestRender();
  }

  getCalcParams(): IndicatorCalcParams {
    return this.calcParams;
  }

  addLayer(layer: IndicatorLayer): void {
    this.layers.push(layer);
    this.requestRender();
  }

  removeLayer(layerId: string): void {
    const prevLength = this.layers.length;
    this.layers = this.layers.filter((layer) => layer.id !== layerId);
    if (this.layers.length !== prevLength) {
      this.requestRender();
    }
  }

  resize(width: number, height: number, _dpr: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.syncViewportSize(width, height);
    this.syncAutoDomain();
    this.requestRender();
  }

  private syncViewportSize(width: number, height: number): void {
    const { ui } = this.store.getState();
    const pane = getPane(ui, this.paneId);
    if (ui.viewportWidth === width && pane.viewportHeight === height) return;

    this.store.setState((prev) => ({
      ...prev,
      ui: {
        ...patchPane(prev.ui, this.paneId, { viewportHeight: height }),
        viewportWidth: width,
      },
    }));
  }

  private getResult(
    kline: ChartDataState["kline"],
  ): IndicatorResult {
    const key = stableParamsKey(this.calcParams);
    if (this.cachedKline === kline && this.cachedParamsKey === key) {
      return this.cachedResult;
    }
    this.cachedResult = this.descriptor.calc(kline, this.calcParams);
    this.cachedKline = kline;
    this.cachedParamsKey = key;
    return this.cachedResult;
  }

  private figureKeys(): string[] {
    const figures =
      this.descriptor.regenerateFigures?.(this.calcParams) ??
      this.descriptor.figures;
    return figures.map((f) => f.key);
  }

  private syncAutoDomain(): void {
    const { data, ui, config } = this.store.getState();
    const pane = getPane(ui, this.paneId);
    if (pane.yAxisMode !== "auto") return;

    const policy = this.descriptor.yDomainPolicy ?? "extent";
    if (policy === "fixed" && this.descriptor.fixedYDomain) {
      const next = this.descriptor.fixedYDomain;
      if (
        pane.domain.min === next.min &&
        pane.domain.max === next.max
      ) {
        return;
      }
      this.store.setState((prev) => ({
        ...prev,
        ui: patchPane(prev.ui, this.paneId, { domain: { ...next } }),
      }));
      return;
    }

    const result = this.getResult(data.kline);
    const startBar = Math.max(0, Math.floor(ui.indexDomain.start));
    const endBar = Math.min(
      data.kline.length - 1,
      Math.ceil(ui.indexDomain.end),
    );
    const values = collectIndicatorVisibleValues(
      result,
      this.figureKeys(),
      startBar,
      endBar,
    );
    const nextDomain = computeAutoIndicatorDomain(values, {
      paddingRatio: config.verticalPaddingRatio,
      includeZero: policy === "extentIncludeZero",
      fromZero: policy === "fromZero",
      fixed: policy === "fixed" ? this.descriptor.fixedYDomain : undefined,
    });

    if (
      pane.domain.min === nextDomain.min &&
      pane.domain.max === nextDomain.max
    ) {
      return;
    }

    this.store.setState((prev) => ({
      ...prev,
      ui: patchPane(prev.ui, this.paneId, { domain: nextDomain }),
    }));
  }

  private bindStore(): void {
    this.unsubscribes.push(
      this.store.subscribeSlice(
        (state) => state.data.kline,
        (kline, prevKline) => {
          this.cachedKline = null;
          if (kline.length === prevKline.length) {
            this.syncAutoDomain();
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

          this.syncAutoDomain();
          this.requestRender();
        },
      ),
      this.store.subscribeSlice(
        (state) => state.ui.indexDomain,
        () => {
          this.syncAutoDomain();
          this.requestRender();
        },
      ),
      this.store.subscribeSlice(
        (state) => state.ui.viewportWidth,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.panes[this.paneId],
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.charts[this.paneId]?.show,
        () => this.requestRender(),
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
        (state) => state.config.showDataPanel,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.config.mode,
        () => this.requestRender(),
      ),
    );
  }

  private getRenderData(): MainIndicatorViewRenderData {
    const { data, ui, config } = this.store.getState();
    const theme = config.resolvedTheme;
    const timezone = config.resolvedTimezone.timezone;
    const pane = getPane(ui, this.paneId);
    const viewportWidth = this.viewportWidth || ui.viewportWidth;
    const viewportHeight = this.viewportHeight || pane.viewportHeight;
    const indicatorResult = this.getResult(data.kline);

    const formatLabel = this.descriptor.formatTick
      ? fromSimpleFormatter(this.descriptor.formatTick)
      : formatIndicatorTick;

    const grid = buildPaneGridLayerData(ui, this.paneId, data.kline, {
      timeAxisOptions: { timezone },
      formatLabel,
      viewportHeight,
      style: gridStyleFromTheme(theme),
    });

    const crosshair = buildPaneCrosshairLayerData(
      ui.crosshair,
      ui,
      this.paneId,
      data.kline,
      viewportWidth,
      viewportHeight,
      crosshairStyleFromTheme(theme),
    );

    const dataPanel = buildIndicatorDataPanelData({
      kline: data.kline,
      crosshair: ui.crosshair,
      theme,
      mode: config.mode,
      viewportWidth,
      viewportHeight,
      descriptor: this.descriptor,
      indicatorResult,
      calcParams: this.calcParams,
      showDataPanel: config.showDataPanel,
    });

    return {
      kline: data.kline,
      bar: computeBarLayoutFromDomain(ui.indexDomain, viewportWidth),
      viewport: {
        indexDomain: ui.indexDomain,
        paneDomain: pane.domain,
        viewportWidth,
        viewportHeight,
      },
      indicatorResult,
      calcParams: this.calcParams,
      theme,
      grid,
      crosshair,
      dataPanel,
    };
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

  render(
    data: MainIndicatorViewRenderData,
    ctx: CanvasRenderingContext2D,
  ): void {
    const { viewportWidth, viewportHeight } = data.viewport;
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    fillThemeBackground(ctx, data.theme, viewportWidth, viewportHeight);

    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of sortedLayers) {
      if (layer instanceof GridLayer) {
        layer.draw(ctx, data.grid);
      } else if (layer instanceof CrosshairLayer) {
        layer.draw(ctx, data.crosshair);
      } else if (layer instanceof DataPanelLayer) {
        layer.draw(ctx, data.dataPanel);
      } else {
        (
          layer as ILayer<
            CanvasRenderingContext2D,
            MainIndicatorViewRenderData
          >
        ).draw(ctx, data);
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
