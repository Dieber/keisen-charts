import type { ILayer } from "../../base/ILayer";
import type { IView } from "../../base/IView";
import type { Unsubscribe } from "../../../store/Store";
import type { Store, KeisenState } from "../../../store/Store";
import { buildXAxisCrosshairHighlight } from "../../shared/buildCrosshairData";
import { fillThemeBackground } from "../../../theme/themeStyles";
import type { ChartDataState, KlineXAxisLayerData } from "../../../types/kline";
import {
  buildKlineXAxisLayerData,
  KlineXAxisLayer,
} from "./layers/KlineXAxisLayer";

export class MainKlineXAxisView implements IView {
  private ctx: CanvasRenderingContext2D;
  private store: Store<KeisenState<ChartDataState>>;
  private layers: ILayer<CanvasRenderingContext2D, KlineXAxisLayerData>[] = [];
  private frameId: number | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private viewportWidth = 0;
  private axisHeight = 0;

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
  id: string = "MainKlineXAxisView";

  init(): void {
    this.addLayer(new KlineXAxisLayer());
  }

  addLayer(layer: ILayer<CanvasRenderingContext2D, KlineXAxisLayerData>): void {
    this.layers.push(layer);
  }

  removeLayer(layerId: string): void {
    this.layers = this.layers.filter((layer) => layer.id !== layerId);
  }

  resize(width: number, height: number, _dpr: number): void {
    this.viewportWidth = width;
    this.axisHeight = height;
    this.requestRender();
  }

  private bindStore(): void {
    this.unsubscribes.push(
      this.store.subscribeSlice(
        (state) => state.ui.indexDomain,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.viewportWidth,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.data.kline,
        () => this.requestRender(),
      ),
      this.store.subscribeSlice(
        (state) => state.ui.crosshair,
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
    );
  }

  private getRenderData(): KlineXAxisLayerData {
    const { ui, data, config } = this.store.getState();
    const viewportWidth = this.viewportWidth || ui.viewportWidth;
    const timezone = config.resolvedTimezone.timezone;
    const crosshair = buildXAxisCrosshairHighlight(
      ui.crosshair,
      ui.indexDomain,
      viewportWidth,
      data.kline,
      timezone,
    );

    return buildKlineXAxisLayerData(
      ui.indexDomain,
      viewportWidth,
      data.kline,
      this.axisHeight || 28,
      config.resolvedTheme,
      crosshair,
      { timezone },
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

  render(data: KlineXAxisLayerData, ctx: CanvasRenderingContext2D): void {
    const width = this.viewportWidth || ctx.canvas.width;
    const height = data.axisHeight || this.axisHeight || ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    fillThemeBackground(ctx, data.theme, width, height);
    this.layers.forEach((layer) => {
      layer.draw(ctx, data);
    });
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
