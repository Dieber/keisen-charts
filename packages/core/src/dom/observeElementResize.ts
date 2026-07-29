/**
 * 用 ResizeObserver 监听元素尺寸变化；返回 disconnect。
 * 回调经 rAF 合并，避免在观察回调里同步改布局触发
 * “ResizeObserver loop completed with undelivered notifications”。
 */
export const observeElementResize = (
  element: Element,
  onResize: () => void,
): (() => void) => {
  let raf = 0;
  const observer = new ResizeObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      onResize();
    });
  });
  observer.observe(element);
  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    observer.disconnect();
  };
};
