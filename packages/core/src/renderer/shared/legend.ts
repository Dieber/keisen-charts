import type { DataPanelRow, DataPanelSegment } from "./layers/types";

/** 一行内的着色片段（与 DataPanelSegment 同形） */
export type LegendSegment = DataPanelSegment;

/**
 * 指标 Layer 向信息层贡献的一项。
 * 相同 groupId 会合并为一行，标题形如 `MA(5,10,20)`。
 */
export type LegendItem = {
  /** 同族合并用，如 "MA" / "EMA" / "BOLL" */
  groupId: string;
  /** 标题前缀，如 "MA" */
  groupLabel: string;
  /** 合并进括号的参数标签；缺省用 sortKey */
  paramLabel?: string;
  /** 同族内排序（如 period） */
  sortKey?: number;
  /** 挂载顺序，决定不同 group 的行序 */
  order: number;
  /** 数值片段（不含 group 标题） */
  segments: LegendSegment[];
};

export type ILegendContributor = {
  getLegendItems(
    barIndex: number,
    data: unknown,
  ): LegendItem | null;
};

export const isLegendContributor = (
  layer: unknown,
): layer is ILegendContributor =>
  typeof layer === "object" &&
  layer !== null &&
  "getLegendItems" in layer &&
  typeof (layer as ILegendContributor).getLegendItems === "function";

const SEGMENT_GAP = "  ";

/**
 * 将同 groupId 的 LegendItem 合并为 DataPanel 行。
 * - 同族按 sortKey 升序；无 sortKey 保持收集顺序
 * - 标题：`GroupLabel(p1,p2,…)`，颜色取首个 value segment 色（或 fallback）
 */
export const mergeLegendItems = (
  items: LegendItem[],
  titleFallbackColor: string,
): DataPanelRow[] => {
  if (items.length === 0) return [];

  const groups = new Map<string, LegendItem[]>();
  const groupOrder: string[] = [];

  for (const item of items) {
    const existing = groups.get(item.groupId);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.groupId, [item]);
      groupOrder.push(item.groupId);
    }
  }

  groupOrder.sort((a, b) => {
    const orderA = groups.get(a)![0]!.order;
    const orderB = groups.get(b)![0]!.order;
    return orderA - orderB;
  });

  const rows: DataPanelRow[] = [];

  for (const groupId of groupOrder) {
    const groupItems = groups.get(groupId)!;
    groupItems.sort((a, b) => {
      const ka = a.sortKey ?? Number.POSITIVE_INFINITY;
      const kb = b.sortKey ?? Number.POSITIVE_INFINITY;
      if (ka !== kb) return ka - kb;
      return a.order - b.order;
    });

    const first = groupItems[0]!;
    const params = groupItems.map(
      (item) => item.paramLabel ?? String(item.sortKey ?? ""),
    );
    const titleText =
      params.length > 0 && params.some((p) => p.length > 0)
        ? `${first.groupLabel}(${params.join(",")})`
        : first.groupLabel;

    const titleColor =
      first.segments[0]?.color ?? titleFallbackColor;

    const segments: LegendSegment[] = [
      { text: titleText, color: titleColor },
    ];

    for (const item of groupItems) {
      for (const seg of item.segments) {
        segments.push({
          text: `${SEGMENT_GAP}${seg.text}`,
          color: seg.color,
        });
      }
    }

    rows.push({ segments });
  }

  return rows;
};

export const formatLegendValue = (
  value: number | null | undefined,
  format: (n: number) => string,
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }
  return format(value);
};
