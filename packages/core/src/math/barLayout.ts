/** scale = 1 时的基准柱宽（像素） */
export const BAR_BASE_WIDTH = 5;

/** scale = 1 时的基准柱间距（像素） */
export const BAR_BASE_SPACING = 1;

export type BarLayout = {
  width: number;
  spacing: number;
};

/**
 * 由 candleStep 推导柱宽与间距。
 * 按 BAR_BASE_WIDTH : BAR_BASE_SPACING 比例拆分，结果始终为整数像素。
 */
export const computeBarLayoutFromStep = (candleStep: number): BarLayout => {
  const baseStep = BAR_BASE_WIDTH + BAR_BASE_SPACING;
  const ratio = BAR_BASE_WIDTH / baseStep;
  const width = Math.max(1, Math.round(candleStep * ratio));
  const spacing = Math.max(0, Math.round(candleStep - width));
  return { width, spacing };
};

export const getCandleStep = (layout: BarLayout): number =>
  layout.width + layout.spacing;
