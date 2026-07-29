import type { KlineBar } from "../types/kline";

export type IndicatorPlacement = "overlay" | "pane";

export type FigureType = "line" | "bar" | "circle";

export type BarColorBy = "valueSign" | "candle";

export type IndicatorFigureStyle = {
  color?: string;
  colorUp?: string;
  colorDown?: string;
  lineWidth?: number;
  /** bar：按值正负（默认）或按 K 线涨跌上色 */
  barColorBy?: BarColorBy;
  /** bar：是否画零轴；默认 true */
  showZeroLine?: boolean;
};

export type IndicatorFigure = {
  /** 读取 calc 结果的字段 */
  key: string;
  type: FigureType;
  /** 默认样式；可被 Layer JSX props 覆盖 */
  style?: IndicatorFigureStyle;
  /** React Layer 显示名 / layerType，缺省用 key 大写 */
  layerType?: string;
};

/** 列式结果：每个 figure key 对应一条与 kline 等长的序列 */
export type IndicatorResult = Record<string, (number | null)[]>;

export type IndicatorCalcParams = number[] | Record<string, number | number[]>;

/** fromZero：min 固定 0，只 pad max（成交量等） */
export type YDomainPolicy =
  | "extent"
  | "extentIncludeZero"
  | "fromZero"
  | "fixed";

export type IndicatorDescriptor = {
  name: string;
  shortName?: string;
  placement: IndicatorPlacement;
  yDomainPolicy?: YDomainPolicy;
  fixedYDomain?: { min: number; max: number };
  /** Y 轴 / 网格 / DataPanel 数值格式；缺省用 formatIndicatorTick */
  formatTick?: (value: number) => string;
  calcParams: IndicatorCalcParams;
  figures: IndicatorFigure[];
  regenerateFigures?: (calcParams: IndicatorCalcParams) => IndicatorFigure[];
  calc: (kline: KlineBar[], calcParams: IndicatorCalcParams) => IndicatorResult;
};
