import type { DrawToolsToolbarProps } from "@keisen-charts/react/toolkit";

import "./draw-tools-toolkit.css";

export type DrawToolsToolbarComponentProps = DrawToolsToolbarProps & {
  className?: string;
  /** 清空按钮文案 */
  clearLabel?: string;
};

/**
 * 纵列画线工具条（内容 only，不含 Popover）。
 * 切换工具 + 全部清空。
 */
export function DrawToolsToolbar({
  tools,
  activeTool,
  setOverlay,
  clearDrawings,
  className,
  clearLabel = "清空",
}: DrawToolsToolbarComponentProps) {
  return (
    <div
      className={["keisen-toolkit-draw-tools", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="画线工具"
    >
      {tools.map((tool) => {
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            className={
              active
                ? "keisen-toolkit-draw-tools__btn keisen-toolkit-draw-tools__btn--active"
                : "keisen-toolkit-draw-tools__btn"
            }
            aria-pressed={active}
            title={tool.label}
            onClick={() => setOverlay(active ? null : tool.id)}
          >
            <span className="keisen-toolkit-draw-tools__label">{tool.label}</span>
          </button>
        );
      })}
      <div className="keisen-toolkit-draw-tools__divider" aria-hidden />
      <button
        type="button"
        className="keisen-toolkit-draw-tools__btn keisen-toolkit-draw-tools__btn--danger"
        title={clearLabel}
        onClick={() => clearDrawings()}
      >
        <span className="keisen-toolkit-draw-tools__label">{clearLabel}</span>
      </button>
    </div>
  );
}
