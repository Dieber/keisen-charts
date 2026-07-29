import type { ExampleFiles } from "../../components/SandpackDemo";
import { reactKlineFiles, vueKlineFiles } from "../../data/kline";

/** getData + onSubscribe（预加载快照 + mock 推送） */
export const runnableData: ExampleFiles = {
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

export const runnableResolution: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import { KeisenChart, type Resolution } from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const OPTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];

export default function App() {
  const [resolution, setResolution] = useState<Resolution>("1");
  const [symbol, setSymbol] = useState("BTCUSDT");

  return (
    <div style={{ width: "100%", height: 420, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 8, padding: 8, flexWrap: "wrap" }}>
        {OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResolution(r)}
            style={{ fontWeight: resolution === r ? 700 : 400 }}
          >
            {r}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSymbol(symbol === "BTCUSDT" ? "ETHUSDT" : "BTCUSDT")}
        >
          {symbol}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <KeisenChart
          key={\`\${symbol}-\${resolution}\`}
          getData={getKlineData}
          onSubscribe={subscribeKline}
          resolution={resolution}
          onResolutionChange={setResolution}
          symbol={symbol}
          mode="light"
        />
      </div>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { ref } from "vue";
import { KeisenChart, type Resolution } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const OPTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];
const resolution = ref<Resolution>("1");
const symbol = ref("BTCUSDT");
</script>

<template>
  <div style="width: 100%; height: 420px; display: flex; flex-direction: column">
    <div style="display: flex; gap: 8px; padding: 8px; flex-wrap: wrap">
      <button
        v-for="r in OPTIONS"
        :key="r"
        type="button"
        :style="{ fontWeight: resolution === r ? 700 : 400 }"
        @click="resolution = r"
      >
        {{ r }}
      </button>
      <button
        type="button"
        @click="symbol = symbol === 'BTCUSDT' ? 'ETHUSDT' : 'BTCUSDT'"
      >
        {{ symbol }}
      </button>
    </div>
    <div style="flex: 1; min-height: 0">
      <KeisenChart
        :key="\`\${symbol}-\${resolution}\`"
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        :resolution="resolution"
        :symbol="symbol"
        mode="light"
        @resolution-change="resolution = $event"
      />
    </div>
  </div>
</template>
`),
};

export const runnableTimezone: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import { KeisenChart, type KlineTimezone } from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const OPTIONS: KlineTimezone[] = ["UTC", "local"];

export default function App() {
  const [timezone, setTimezone] = useState<KlineTimezone>("UTC");
  return (
    <div style={{ width: "100%", height: 420, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        {OPTIONS.map((tz) => (
          <button
            key={tz}
            type="button"
            onClick={() => setTimezone(tz)}
            style={{ fontWeight: timezone === tz ? 700 : 400 }}
          >
            {tz}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          timezone={timezone}
          onTimezoneChange={setTimezone}
          mode="light"
        />
      </div>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { ref } from "vue";
import { KeisenChart, type KlineTimezone } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const OPTIONS: KlineTimezone[] = ["UTC", "local"];
const timezone = ref<KlineTimezone>("UTC");
</script>

<template>
  <div style="width: 100%; height: 420px; display: flex; flex-direction: column">
    <div style="display: flex; gap: 8px; padding: 8px">
      <button
        v-for="tz in OPTIONS"
        :key="tz"
        type="button"
        :style="{ fontWeight: timezone === tz ? 700 : 400 }"
        @click="timezone = tz"
      >
        {{ tz }}
      </button>
    </div>
    <div style="flex: 1; min-height: 0">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        resolution="1"
        :timezone="timezone"
        mode="light"
        @timezone-change="timezone = $event"
      />
    </div>
  </div>
</template>
`),
};
