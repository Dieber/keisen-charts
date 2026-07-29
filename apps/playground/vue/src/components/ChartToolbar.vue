<script setup lang="ts">
import {
  useKlineResolution,
  useKlineTheme,
  useKlineTimezone,
  useKlineLocale,
} from "@keisen-charts/vue";
import type { Resolution } from "@keisen-charts/vue";
import type { IndicatorPanelProps } from "@keisen-charts/vue/toolkit";
import { onBeforeUnmount, onMounted, ref } from "vue";

import { IndicatorSettingsPanel } from "../toolkits/indicator";
import { DrawToolsToolbar, useDrawOverlay } from "../toolkits/draw-tools";
import {
  LOCALE_OPTIONS,
  RESOLUTION_OPTIONS,
  SYMBOL_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
  type SymbolId,
} from "../demo/constants";
import ThemeChrome from "./ThemeChrome.vue";

const props = defineProps<{
  symbol: SymbolId;
  compactDemo: boolean;
  indicatorPanelProps: IndicatorPanelProps;
  drawToolsOpen: boolean;
}>();

const emit = defineEmits<{
  "symbol-change": [symbol: SymbolId];
  "compact-demo-change": [value: boolean];
  "draw-tools-open-change": [open: boolean];
}>();

const { resolution, setResolution } = useKlineResolution();
const { themeId, setTheme, mode, setMode, upDown, setUpDown } = useKlineTheme();
const { timezone, setTimezone } = useKlineTimezone();
const { locale, setLocale } = useKlineLocale();
const { toolbarProps, setOverlay } = useDrawOverlay();

const indicatorOpen = ref(false);
const hostRef = ref<HTMLDivElement | null>(null);

const toggleDrawTools = () => {
  if (props.drawToolsOpen) setOverlay(null);
  emit("draw-tools-open-change", !props.drawToolsOpen);
};

const onResolutionChange = (event: Event) => {
  setResolution((event.target as HTMLSelectElement).value as Resolution);
};

const onPointerDown = (event: PointerEvent) => {
  if (!indicatorOpen.value) return;
  if (!hostRef.value?.contains(event.target as Node)) {
    indicatorOpen.value = false;
  }
};
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") indicatorOpen.value = false;
};

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <ThemeChrome>
    <div class="toolbar">
      <div class="toolbar-group">
        <button
          v-for="option in SYMBOL_OPTIONS"
          :key="option.value"
          type="button"
          :class="{ active: props.symbol === option.value }"
          @click="emit('symbol-change', option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="toolbar-group">
        <select
          class="toolbar-select"
          aria-label="周期"
          :value="resolution"
          @change="onResolutionChange"
        >
          <option
            v-for="option in RESOLUTION_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="toolbar-group">
        <button
          v-for="option in TIMEZONE_OPTIONS"
          :key="option.value"
          type="button"
          :class="{ active: timezone === option.value }"
          @click="setTimezone(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          v-for="option in LOCALE_OPTIONS"
          :key="option.value"
          type="button"
          :class="{ active: locale === option.value }"
          @click="setLocale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          v-for="option in THEME_OPTIONS"
          :key="option.value"
          type="button"
          :class="{ active: themeId === option.value }"
          @click="setTheme(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :class="{ active: mode === 'dark' }"
          @click="setMode(mode === 'dark' ? 'light' : 'dark')"
        >
          {{ mode === "dark" ? "Dark" : "Light" }}
        </button>
        <button
          type="button"
          :class="{ active: upDown === 'red-up' }"
          @click="setUpDown(upDown === 'green-up' ? 'red-up' : 'green-up')"
        >
          {{ upDown === "green-up" ? "绿涨" : "红涨" }}
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :class="{ active: props.compactDemo }"
          title="演示 custom formatter：0.0{n}xxx"
          @click="emit('compact-demo-change', !props.compactDemo)"
        >
          Compact
        </button>
      </div>

      <div ref="hostRef" class="toolbar-group indicator-panel-host">
        <button
          type="button"
          :class="{ active: indicatorOpen }"
          :aria-expanded="indicatorOpen"
          @click="indicatorOpen = !indicatorOpen"
        >
          指标设置
        </button>
        <div v-if="indicatorOpen" class="indicator-panel-shell">
          <IndicatorSettingsPanel
            v-bind="props.indicatorPanelProps"
            :on-confirm="() => (indicatorOpen = false)"
          />
        </div>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :class="{ active: props.drawToolsOpen }"
          :aria-pressed="props.drawToolsOpen"
          @click="toggleDrawTools"
        >
          画线
        </button>
      </div>
    </div>
    <aside
      v-if="props.drawToolsOpen"
      class="draw-tools-rail"
      aria-label="画线工具栏"
    >
      <DrawToolsToolbar v-bind="toolbarProps" />
    </aside>
  </ThemeChrome>
</template>
