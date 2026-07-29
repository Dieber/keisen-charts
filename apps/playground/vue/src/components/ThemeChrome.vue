<script setup lang="ts">
import { useKlineTheme } from "@keisen-charts/vue";
import { computed, onBeforeUnmount, watch } from "vue";

const { mode, colors, themeId } = useKlineTheme();

const pageBg = computed(() =>
  colors.value.background !== "transparent"
    ? colors.value.background
    : mode.value === "dark"
      ? "#0f0f0f"
      : "#f5f5f5",
);

watch(
  pageBg,
  (bg) => {
    document.body.style.background = bg;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.body.style.background = "";
});
</script>

<template>
  <div :class="`theme-${themeId}`">
    <div
      class="theme-chrome"
      :class="`mode-${mode}`"
      :style="{ background: pageBg }"
    >
      <slot />
    </div>
  </div>
</template>
