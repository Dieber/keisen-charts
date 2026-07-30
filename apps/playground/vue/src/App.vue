<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  VNodes,
  type ChartPointerInfo,
} from "@keisen-charts/vue";
import { useKlineIndicator } from "@keisen-charts/vue/toolkit";
import { computed, ref } from "vue";

import { binanceGetData } from "./api/binanceCandles";
import { binanceOnSubscribe } from "./api/binanceStream";
import ChartToolbar from "./components/ChartToolbar.vue";
import { createBiasChart } from "./demo/biasIndicator";
import {
  COMPACT_DEMO_FORMAT,
  SYMBOL_PRICE_FORMAT,
  type SymbolId,
} from "./demo/constants";

const symbol = ref<SymbolId>("XRPUSDT");
const compactDemo = ref(false);
const drawToolsOpen = ref(true);
const pointerHud = ref("pointer: —");

const priceFormat = computed(() =>
  compactDemo.value
    ? COMPACT_DEMO_FORMAT
    : SYMBOL_PRICE_FORMAT[symbol.value],
);

const formatPointerHud = (info: ChartPointerInfo | null) => {
  if (!info) return "pointer: —";
  const t = new Date(info.timestamp).toISOString().slice(11, 19);
  return `pointer: ${info.chartId}  x=${info.x.toFixed(0)} y=${info.y.toFixed(0)}  t=${t}  v=${info.value.toPrecision(6)}  bar=${info.barIndex}`;
};

const onPointerMove = (info: ChartPointerInfo | null) => {
  pointerHud.value = formatPointerHud(info);
};

const onChartClick = (info: ChartPointerInfo) => {
  console.log("[chart click]", info);
  pointerHud.value = `click: ${formatPointerHud(info)}`;
};

const { panelProps, mainLayers, paneCharts } = useKlineIndicator({
  extras: [
    {
      id: "bias",
      meta: {
        group: "pane",
        label: "BIAS",
        colorLabels: { bias: "BIAS" },
        paramFields: [
          {
            key: "period",
            label: "周期",
            kind: "number",
            min: 1,
            step: 1,
          },
        ],
      },
      defaultSetting: {
        visible: false,
        colors: { bias: "#ae3ec9" },
        params: { period: 6 },
      },
      createChart: createBiasChart,
    },
  ],
});
</script>

<template>
  <div
    class="chart-container"
    :class="{ 'draw-tools-open': drawToolsOpen }"
  >
    <div class="pointer-hud">{{ pointerHud }}</div>
    <KeisenChart
      :symbol="symbol"
      :get-data="binanceGetData"
      :on-subscribe="binanceOnSubscribe"
      :price-format="priceFormat"
      @pointer-move="onPointerMove"
      @click="onChartClick"
    >
      <template #header>
        <ChartToolbar
          :symbol="symbol"
          :compact-demo="compactDemo"
          :indicator-panel-props="panelProps"
          :draw-tools-open="drawToolsOpen"
          @symbol-change="symbol = $event"
          @compact-demo-change="compactDemo = $event"
          @draw-tools-open-change="drawToolsOpen = $event"
        />
      </template>

      <MainKlineChart renderer="canvas">
        <KlineCandles />
        <VNodes :nodes="mainLayers" />
      </MainKlineChart>
      <VNodes :nodes="paneCharts" />
    </KeisenChart>
  </div>
</template>
