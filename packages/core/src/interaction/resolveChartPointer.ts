import { timeAtBarIndex } from "../drawings/anchor";
import { buildDrawingHelpers } from "../drawings/projectHelpers";
import { snapBarIndex } from "../math/crosshair";
import { getPane, type KeisenState } from "../store/Store";
import type { ChartDataState } from "../types/kline";

/** 对外语义化 pointer 信息（纯数据，不含 DOM） */
export type ChartPointerInfo = {
  /** 即 viewId：`main` | `volume` | `macd` | … */
  chartId: string;
  /** 该 pane canvas 本地像素坐标 */
  x: number;
  y: number;
  /** 对应 bar 时间（`timeAtBarIndex`） */
  timestamp: number;
  /** 该 pane Y 轴反算值（价格 / volume / 指标） */
  value: number;
  /** 吸附或连续 bar 索引 */
  barIndex: number;
  /** `mouse` | `touch` | `pen` 等 */
  pointerType?: string;
};

export type ResolveChartPointerInput = {
  viewId: string;
  x: number;
  y: number;
  pointerType?: string;
};

export type ResolveChartPointerOptions = {
  /** 默认 true：与十字线一致吸附到整数 bar */
  snap?: boolean;
};

const isChartPointerSource = (
  viewId: string,
  state: KeisenState<ChartDataState>,
): boolean => viewId === "main" || viewId in state.ui.panes;

const resolvePaneGeometry = (
  viewId: string,
  state: KeisenState<ChartDataState>,
) => {
  const { ui } = state;
  if (viewId === "main") {
    return {
      paneId: "main",
      indexDomain: ui.indexDomain,
      valueDomain: ui.priceDomain,
      viewportWidth: ui.viewportWidth,
      viewportHeight: ui.viewportHeight,
    };
  }
  const pane = getPane(ui, viewId);
  return {
    paneId: viewId,
    indexDomain: ui.indexDomain,
    valueDomain: pane.domain,
    viewportWidth: ui.viewportWidth,
    viewportHeight: pane.viewportHeight,
  };
};

/**
 * 将 canvas 本地 pointer 坐标投影为业务可用的语义信息。
 * 非主图 / 副图来源或空数据时返回 null。
 */
export const resolveChartPointer = (
  state: KeisenState<ChartDataState>,
  input: ResolveChartPointerInput,
  options: ResolveChartPointerOptions = {},
): ChartPointerInfo | null => {
  if (!isChartPointerSource(input.viewId, state)) return null;

  const { data } = state;
  if (data.kline.length === 0) return null;

  const snap = options.snap !== false;
  const geo = resolvePaneGeometry(input.viewId, state);
  const helpers = buildDrawingHelpers(geo);

  const barIndex = snap
    ? snapBarIndex(
        input.x,
        geo.indexDomain,
        geo.viewportWidth,
        data.kline.length,
      )
    : Math.max(
        0,
        Math.min(data.kline.length - 1, helpers.barOfX(input.x)),
      );

  return {
    chartId: geo.paneId,
    x: input.x,
    y: input.y,
    timestamp: timeAtBarIndex(data.kline, barIndex),
    value: helpers.valueOfY(input.y),
    barIndex,
    pointerType: input.pointerType,
  };
};
