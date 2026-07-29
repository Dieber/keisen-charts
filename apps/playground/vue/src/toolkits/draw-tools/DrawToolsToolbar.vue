<script setup lang="ts">
import type { DrawingToolId, DrawingToolMeta } from "@keisen-charts/vue/toolkit";

import "./draw-tools-toolkit.css";

/**
 * Props 须在本文件内联：Vue SFC 无法解析跨包 `DrawToolsToolbarProps & {…}`。
 * 形状与 `@keisen-charts/vue/toolkit` 的 DrawToolsToolbarProps 对齐；
 * setOverlay 必须用 DrawingToolId（不能放宽成 string），否则与 useDrawOverlay 回调逆变不兼容。
 */
const props = withDefaults(
  defineProps<{
    tools: DrawingToolMeta[];
    activeTool: DrawingToolId | null;
    setOverlay: (tool: DrawingToolId | null) => void;
    clearDrawings: (paneId?: string) => void;
    className?: string;
    clearLabel?: string;
  }>(),
  {
    clearLabel: "清空",
  },
);
</script>

<template>
  <div
    :class="['keisen-toolkit-draw-tools', props.className].filter(Boolean)"
    role="toolbar"
    aria-label="画线工具"
  >
    <button
      v-for="tool in props.tools"
      :key="tool.id"
      type="button"
      :class="[
        'keisen-toolkit-draw-tools__btn',
        {
          'keisen-toolkit-draw-tools__btn--active':
            props.activeTool === tool.id,
        },
      ]"
      :aria-pressed="props.activeTool === tool.id"
      :title="tool.label"
      @click="
        props.setOverlay(
          props.activeTool === tool.id ? null : tool.id,
        )
      "
    >
      <span class="keisen-toolkit-draw-tools__label">{{ tool.label }}</span>
    </button>
    <div class="keisen-toolkit-draw-tools__divider" aria-hidden="true" />
    <button
      type="button"
      class="keisen-toolkit-draw-tools__btn keisen-toolkit-draw-tools__btn--danger"
      :title="props.clearLabel"
      @click="props.clearDrawings()"
    >
      <span class="keisen-toolkit-draw-tools__label">{{ props.clearLabel }}</span>
    </button>
  </div>
</template>
