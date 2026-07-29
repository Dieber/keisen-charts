import type { ExampleFiles } from "../../components/SandpackDemo";
import { reactKlineFiles, vueKlineFiles } from "../../data/kline";

/** priceFormat：内置精度 vs custom formatter */
export const runnableFormatter: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import {
  KeisenChart,
  createPriceFormatter,
  formatCompactTiny,
  type PriceFormat,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

type Mode = "price" | "precise" | "custom";

const FORMATS: Record<Mode, PriceFormat> = {
  // 普通：1 位小数（贴近 BTC 常见 tick）
  price: {
    type: "price",
    minMove: 0.1,
    precision: 1,
    useGrouping: true,
  },
  // 更高精度（演示 precision / minMove）
  precise: {
    type: "price",
    minMove: 0.01,
    precision: 2,
    useGrouping: false,
  },
  // 自定义：货币前缀；极小数可走 compact
  custom: {
    type: "custom",
    minMove: 0.01,
    formatter: (value, ctx) => {
      const compact = formatCompactTiny(value, { significantDigits: 4 });
      if (compact) return compact;
      return (
        "$" +
        createPriceFormatter({
          type: "price",
          minMove: 0.01,
          precision: 2,
          useGrouping: true,
        })(value, ctx)
      );
    },
  },
};

const LABELS: Record<Mode, string> = {
  price: "1 位小数",
  precise: "2 位小数",
  custom: "custom $",
};

export default function App() {
  const [mode, setMode] = useState<Mode>("price");

  return (
    <div
      style={{
        width: "100%",
        height: 440,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        {(Object.keys(FORMATS) as Mode[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            style={{ fontWeight: mode === id ? 700 : 400 }}
          >
            {LABELS[id]}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          mode="light"
          priceFormat={FORMATS[mode]}
        />
      </div>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { computed, ref } from "vue";
import {
  KeisenChart,
  createPriceFormatter,
  formatCompactTiny,
  type PriceFormat,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

type Mode = "price" | "precise" | "custom";

const FORMATS: Record<Mode, PriceFormat> = {
  price: {
    type: "price",
    minMove: 0.1,
    precision: 1,
    useGrouping: true,
  },
  precise: {
    type: "price",
    minMove: 0.01,
    precision: 2,
    useGrouping: false,
  },
  custom: {
    type: "custom",
    minMove: 0.01,
    formatter: (value, ctx) => {
      const compact = formatCompactTiny(value, { significantDigits: 4 });
      if (compact) return compact;
      return (
        "$" +
        createPriceFormatter({
          type: "price",
          minMove: 0.01,
          precision: 2,
          useGrouping: true,
        })(value, ctx)
      );
    },
  },
};

const LABELS: Record<Mode, string> = {
  price: "1 位小数",
  precise: "2 位小数",
  custom: "custom $",
};

const mode = ref<Mode>("price");
const priceFormat = computed(() => FORMATS[mode.value]);
const modes = Object.keys(FORMATS) as Mode[];
</script>

<template>
  <div style="width: 100%; height: 440px; display: flex; flex-direction: column">
    <div style="display: flex; gap: 8px; padding: 8px">
      <button
        v-for="id in modes"
        :key="id"
        type="button"
        :style="{ fontWeight: mode === id ? 700 : 400 }"
        @click="mode = id"
      >
        {{ LABELS[id] }}
      </button>
    </div>
    <div style="flex: 1; min-height: 0">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
        :price-format="priceFormat"
      />
    </div>
  </div>
</template>
`),
};
