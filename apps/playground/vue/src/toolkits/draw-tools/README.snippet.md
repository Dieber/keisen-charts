# Draw tools toolkit (Vue)

```vue
<script setup lang="ts">
import { ref } from "vue";
import { KeisenChart, MainKlineChart, KlineCandles } from "@keisen-charts/vue";
import { DrawToolsToolbar, useDrawOverlay } from "./toolkits/draw-tools";

const drawToolsOpen = ref(true);
</script>

<template>
  <div
    class="chart-container"
    :class="{ 'draw-tools-open': drawToolsOpen }"
  >
    <KeisenChart>
      <template #header>
        <DrawDockInner
          :open="drawToolsOpen"
          @open-change="drawToolsOpen = $event"
        />
      </template>
      <MainKlineChart renderer="canvas">
        <KlineCandles />
      </MainKlineChart>
    </KeisenChart>
  </div>
</template>
```

`DrawDockInner` example:

```vue
<script setup lang="ts">
import { DrawToolsToolbar, useDrawOverlay } from "./toolkits/draw-tools";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "open-change": [open: boolean] }>();

const { toolbarProps, setOverlay } = useDrawOverlay();

const toggle = () => {
  if (props.open) setOverlay(null);
  emit("open-change", !props.open);
};
</script>

<template>
  <button
    type="button"
    :class="{ active: props.open }"
    :aria-pressed="props.open"
    @click="toggle"
  >
    画线
  </button>
  <aside v-if="props.open" class="draw-tools-rail">
    <DrawToolsToolbar v-bind="toolbarProps" />
  </aside>
</template>
```

Notes:

- `useDrawOverlay` must run inside `KeisenChart`.
- Put the toolbar in a left rail beside the chart (not floating over candles). Toggle with a header button; host layout should reserve width (e.g. `.draw-tools-open { padding-left: … }`).
- `setOverlay("ray")` enters place mode; click on any pane to drop points.
- `addDrawing({...})` creates shapes programmatically.
- Esc cancels tool / clears selection; Delete removes selected.
