import type { ExampleFiles } from "../../components/SandpackDemo";
import { BTC_KLINES } from "../../data/kline";

/** 取末尾一段，够填满视口又不撑爆编辑器 */
const SAMPLE_BARS = BTC_KLINES.slice(-120);
const DATA_MODULE = `export type KlineBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export const data: KlineBar[] = ${JSON.stringify(SAMPLE_BARS)};
`;

/** Quick Start：静态 data，最小可运行示例 */
export const runnableQuickStart: ExampleFiles = {
  react: {
    "/App.tsx": `import { KeisenChart } from "@keisen-charts/react";
import { data } from "./data";

export default function App() {
  return (
    <div style={{ width: "100%", height: 420 }}>
      <KeisenChart data={data} mode="light" />
    </div>
  );
}
`,
    "/data.ts": DATA_MODULE,
  },
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import { KeisenChart } from "@keisen-charts/vue";
import { data } from "./data";
</script>

<template>
  <div style="width: 100%; height: 420px">
    <KeisenChart :data="data" mode="light" />
  </div>
</template>
`,
    "/src/data.ts": DATA_MODULE,
  },
};
