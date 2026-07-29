/** 副图槽位（内置 + 自定义 string） */
export type SubChartSlot = string;

export const BUILTIN_SUB_CHART_ORDER: SubChartSlot[] = [
  "volume",
  "macd",
  "rsi",
  "kdj",
  "obv",
  "cci",
  "wr",
  "dmi",
  "mtm",
];

/** 副图默认高度权重（相对可分配高度）；volume 保持历史 0.25 */
export const DEFAULT_SUB_PANE_WEIGHT: Record<string, number> = {
  volume: 0.25,
  macd: 0.15,
  rsi: 0.15,
  kdj: 0.15,
  obv: 0.15,
  cci: 0.15,
  wr: 0.15,
  dmi: 0.15,
  mtm: 0.15,
};

const DEFAULT_CUSTOM_WEIGHT = 0.15;

const chartDisplayNames: Record<string, "main" | SubChartSlot> = {
  MainKlineChart: "main",
  VolumeChart: "volume",
  MACDChart: "macd",
  RSIChart: "rsi",
  KDJChart: "kdj",
  OBVChart: "obv",
  CCIChart: "cci",
  WRChart: "wr",
  DMIChart: "dmi",
  MTMChart: "mtm",
};

const extraSlotOrder: SubChartSlot[] = [];

export const registerChartSlot = (
  displayName: string,
  slotId: SubChartSlot,
): void => {
  chartDisplayNames[displayName] = slotId;
  if (
    slotId !== "main" &&
    !BUILTIN_SUB_CHART_ORDER.includes(slotId) &&
    !extraSlotOrder.includes(slotId)
  ) {
    extraSlotOrder.push(slotId);
  }
};

export const getChartDisplayNames = (): Readonly<
  Record<string, "main" | SubChartSlot>
> => chartDisplayNames;

export const getSubChartOrder = (): SubChartSlot[] => [
  ...BUILTIN_SUB_CHART_ORDER,
  ...extraSlotOrder,
];

export const resolveChartSlot = (
  displayName: string | undefined,
): "main" | SubChartSlot | null => {
  if (!displayName) return null;
  if (displayName in chartDisplayNames) {
    return chartDisplayNames[displayName]!;
  }
  return null;
};

export const getRequestedSubSlots = (
  slots: Partial<Record<SubChartSlot, unknown>> & { main?: unknown },
): SubChartSlot[] =>
  getSubChartOrder().filter((slot) => slots[slot] != null);

export const buildDefaultSubPaneWeights = (
  visibleSlots: SubChartSlot[],
): number[] =>
  visibleSlots.map(
    (slot) => DEFAULT_SUB_PANE_WEIGHT[slot] ?? DEFAULT_CUSTOM_WEIGHT,
  );

/**
 * 当可见副图集合变化时，尽量保留已有权重，新增槽位用默认值。
 */
export const reconcileSubPaneWeights = (
  prevSlots: SubChartSlot[],
  prevWeights: number[],
  nextSlots: SubChartSlot[],
): number[] => {
  const prevBySlot = new Map(
    prevSlots.map((slot, i) => [
      slot,
      prevWeights[i] ?? DEFAULT_SUB_PANE_WEIGHT[slot] ?? DEFAULT_CUSTOM_WEIGHT,
    ]),
  );
  return nextSlots.map(
    (slot) =>
      prevBySlot.get(slot) ??
      DEFAULT_SUB_PANE_WEIGHT[slot] ??
      DEFAULT_CUSTOM_WEIGHT,
  );
};

export type BuildGridRowsInput = {
  /** 副图权重，与 visibleSlots 对齐 */
  subPaneWeights: number[];
  visibleSlots: SubChartSlot[];
};

/**
 * 生成 CSS grid-template-rows：
 * main | sub* | xaxis
 */
export const buildGridRows = ({
  subPaneWeights,
  visibleSlots,
}: BuildGridRowsInput): string => {
  const rows: string[] = [];
  const subCount = visibleSlots.length;

  if (subCount === 0) {
    rows.push("minmax(0, 1fr)");
    rows.push("auto");
    return rows.join(" ");
  }

  rows.push("minmax(0, 1fr)");
  for (let i = 0; i < subCount; i++) {
    const weight =
      subPaneWeights[i] ??
      DEFAULT_SUB_PANE_WEIGHT[visibleSlots[i]!] ??
      DEFAULT_CUSTOM_WEIGHT;
    rows.push(`minmax(80px, ${Math.round(weight * 100)}%)`);
  }
  rows.push("auto");
  return rows.join(" ");
};

export type PaneGridPlacement = {
  chartRow: number;
  yAxisRow: number;
};

/**
 * 计算各副图在 Grid 中的行号（1-based CSS grid rows）。
 * 主图始终在 row 1；随后为各副图；最后 X 轴。
 */
export const getSubPanePlacements = (
  visibleSlots: SubChartSlot[],
): Record<string, PaneGridPlacement | undefined> => {
  const result: Record<string, PaneGridPlacement | undefined> = {};
  let row = 2; // row 1 = main

  for (const slot of visibleSlots) {
    result[slot] = {
      chartRow: row,
      yAxisRow: row,
    };
    row += 1;
  }

  return result;
};

export const getXAxisRow = (visibleSlotCount: number): number => {
  if (visibleSlotCount === 0) return 2;
  return 1 + visibleSlotCount + 1;
};

/** 测试用：重置自定义 slot 注册 */
export const clearChartSlotRegistry = (): void => {
  for (const key of Object.keys(chartDisplayNames)) {
    if (
      ![
        "MainKlineChart",
        "VolumeChart",
        "MACDChart",
        "RSIChart",
        "KDJChart",
        "OBVChart",
        "CCIChart",
        "WRChart",
        "DMIChart",
        "MTMChart",
      ].includes(key)
    ) {
      delete chartDisplayNames[key];
    }
  }
  extraSlotOrder.length = 0;
};
