/**
 * 用 ResizeObserver 监听元素尺寸变化；返回 disconnect。
 */
export const observeElementResize = (
  element: Element,
  onResize: () => void,
): (() => void) => {
  const observer = new ResizeObserver(onResize);
  observer.observe(element);
  return () => observer.disconnect();
};
