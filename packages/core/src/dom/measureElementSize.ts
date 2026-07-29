export type ElementSize = {
  width: number;
  height: number;
};

/**
 * 读取元素挂载后的 CSS 布局尺寸。
 * 优先使用 clientWidth/clientHeight，回退到 getBoundingClientRect。
 */
export const measureElementSize = (element: HTMLElement): ElementSize => {
  const rect = element.getBoundingClientRect();
  const width = element.clientWidth || rect.width;
  const height = element.clientHeight || rect.height;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};
