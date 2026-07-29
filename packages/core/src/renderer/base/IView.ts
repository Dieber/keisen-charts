import type { ILayer } from "./ILayer";

export interface IView<TContext = CanvasRenderingContext2D> {
  readonly zIndex: number;
  readonly id: string; // 方便调试和查找，如 'CandleLayer'
  
  /**
   * 核心绘制指令。
   * 对于 Canvas/WebGL，这里执行真正的绘图；
   * 对于 HtmlView，这里可以用来更新 DOM 节点的数据或状态。
   */
  addLayer(layer: ILayer<TContext>): void;
  removeLayer(layerId: string): void;
  resize(width: number, height: number, dpr: number): void;
  flushRender(): void;
  render(data: any, ctx: TContext): void;
  destroy(): void;
}