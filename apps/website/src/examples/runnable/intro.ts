import type { ExampleFiles } from "../../components/SandpackDemo";
import { reactKlineFiles, vueKlineFiles } from "../../data/kline";

/** Introduction：默认主图 + BTC 历史 / mock 推送 */
export const runnableIntro: ExampleFiles = {
  react: reactKlineFiles(`import { KeisenChart } from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

export default function App() {
  return (
    <div style={{ width: "100%", height: 420 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
      />
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { KeisenChart } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
</script>

<template>
  <div style="width: 100%; height: 420px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    />
  </div>
</template>
`),
};
