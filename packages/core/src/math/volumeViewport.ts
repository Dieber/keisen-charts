/** 默认成交量格式化（主图 DataPanel / VOLUME 副图 tick） */
export const defaultFormatVolume = (volume: number): string => {
  const abs = Math.abs(volume);
  if (abs >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  if (abs < 1) return volume.toFixed(2);
  return volume.toFixed(0);
};
