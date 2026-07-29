export interface ILayer<
  TContext = CanvasRenderingContext2D,
  TData = unknown,
> {
  readonly zIndex: number;
  readonly id: string; // 方便调试和查找，如 'CandleLayer'
  
  /**
   * 核心绘制指令。
   * 对于 Canvas/WebGL，这里执行真正的绘图；
   * 对于 HtmlView，这里可以用来更新 DOM 节点的数据或状态。
   */
  draw(context: TContext, data: TData): void;
}