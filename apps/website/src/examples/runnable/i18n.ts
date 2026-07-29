import type { ExampleFiles } from "../../components/SandpackDemo";
import {
  KLINE_MODULE,
  KLINE_PATH_VUE,
  reactKlineFiles,
} from "../../data/kline";

/** registerLocale + useKlineLocale 切换 */
export const runnableI18n: ExampleFiles = {
  react: reactKlineFiles(`import {
  KeisenChart,
  registerLocale,
  useKlineLocale,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

registerLocale("zh-HK", {
  time: "時間：",
  open: "開：",
  high: "高：",
  low: "低：",
  close: "收：",
  volume: "量：",
});

const OPTIONS = ["zh-CN", "en-US", "zh-HK"] as const;

function LocaleToggle() {
  const { locale, setLocale } = useKlineLocale();
  return (
    <div style={{ display: "flex", gap: 8, padding: 8 }}>
      {OPTIONS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setLocale(id)}
          style={{ fontWeight: locale === id ? 700 : 400 }}
        >
          {id}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: "100%", height: 420 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        locale="zh-CN"
        mode="light"
        header={<LocaleToggle />}
      />
    </div>
  );
}
`),
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import { KeisenChart, registerLocale } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
import LocaleToggle from "./LocaleToggle.vue";

registerLocale("zh-HK", {
  time: "時間：",
  open: "開：",
  high: "高：",
  low: "低：",
  close: "收：",
  volume: "量：",
});
</script>

<template>
  <div style="width: 100%; height: 420px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      locale="zh-CN"
      mode="light"
    >
      <template #header>
        <LocaleToggle />
      </template>
    </KeisenChart>
  </div>
</template>
`,
    "/src/LocaleToggle.vue": `<script setup lang="ts">
import { useKlineLocale } from "@keisen-charts/vue";

const OPTIONS = ["zh-CN", "en-US", "zh-HK"] as const;
const { locale, setLocale } = useKlineLocale();
</script>

<template>
  <div style="display: flex; gap: 8px; padding: 8px">
    <button
      v-for="id in OPTIONS"
      :key="id"
      type="button"
      :style="{ fontWeight: locale === id ? 700 : 400 }"
      @click="setLocale(id)"
    >
      {{ id }}
    </button>
  </div>
</template>
`,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  },
};
