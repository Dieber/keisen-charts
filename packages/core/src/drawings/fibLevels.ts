export const DEFAULT_FIB_LEVELS = [
  0, 0.236, 0.382, 0.5, 0.618, 0.786, 1,
] as const;

export const fibValueAt = (
  high: number,
  low: number,
  level: number,
): number => high + (low - high) * level;
