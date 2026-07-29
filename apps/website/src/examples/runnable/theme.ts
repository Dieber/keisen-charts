import type { ExampleFiles } from "../../components/SandpackDemo";
import { reactKlineFiles, vueKlineFiles } from "../../data/kline";

/** 明暗模式 + 按 mode 覆盖 token */
export const runnableThemeMode: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import { KeisenChart, type ThemeMode } from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const darkOverride = {
  background: "#131722",
  grid: "#2a2e39",
  accent: "#f0b90b",
  axisText: "#d1d4dc",
};

const lightOverride = {
  background: "#ffffff",
  grid: "#e0e3eb",
  accent: "#c99400",
  axisText: "#131722",
};

export default function App() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const tokens = mode === "dark" ? darkOverride : lightOverride;

  return (
    <div style={{ width: "100%", height: 420, background: tokens.background }}>
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        <button type="button" onClick={() => setMode("dark")}>
          dark
        </button>
        <button type="button" onClick={() => setMode("light")}>
          light
        </button>
      </div>
      <div style={{ height: 360 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          mode={mode}
          onModeChange={setMode}
          theme={tokens}
        />
      </div>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { computed, ref } from "vue";
import { KeisenChart, type ThemeMode } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const mode = ref<ThemeMode>("dark");

const darkOverride = {
  background: "#131722",
  grid: "#2a2e39",
  accent: "#f0b90b",
  axisText: "#d1d4dc",
};

const lightOverride = {
  background: "#ffffff",
  grid: "#e0e3eb",
  accent: "#c99400",
  axisText: "#131722",
};

const tokens = computed(() =>
  mode.value === "dark" ? darkOverride : lightOverride,
);
</script>

<template>
  <div
    style="width: 100%; height: 420px"
    :style="{ background: tokens.background }"
  >
    <div style="display: flex; gap: 8px; padding: 8px">
      <button type="button" @click="mode = 'dark'">dark</button>
      <button type="button" @click="mode = 'light'">light</button>
    </div>
    <div style="height: 360px">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        resolution="1"
        :mode="mode"
        :theme="tokens"
        @mode-change="mode = $event"
      />
    </div>
  </div>
</template>
`),
};

/** registerTheme + 用 id / 对象引用 */
export const runnableThemeCustom: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import {
  KeisenChart,
  registerTheme,
  neonTheme,
  type ThemeDefinition,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const ocean: ThemeDefinition = {
  id: "ocean",
  modes: {
    dark: {
      background: "#0b1c24",
      grid: "#1e3a46",
      axisTick: "#5b8a9a",
      axisText: "#c8e6ef",
      crosshair: "#4fc3f7",
      crosshairLabelBg: "#0277bd",
      crosshairLabelText: "#ffffff",
      up: "#26c6da",
      down: "#ef5350",
      accent: "#29b6f6",
    },
    light: {
      background: "#f3fafc",
      grid: "#cfd8dc",
      axisTick: "#78909c",
      axisText: "#263238",
      crosshair: "#0288d1",
      crosshairLabelBg: "#0277bd",
      crosshairLabelText: "#ffffff",
      up: "#00838f",
      down: "#e53935",
      accent: "#039be5",
    },
  },
};

registerTheme(neonTheme);
registerTheme(ocean);

type ThemeId = "default" | "neon" | "ocean";

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>("ocean");
  const bg =
    themeId === "neon"
      ? "#0a0a12"
      : themeId === "ocean"
        ? "#0b1c24"
        : "#131722";

  return (
    <div style={{ width: "100%", height: 420, background: bg }}>
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        {(["default", "neon", "ocean"] as ThemeId[]).map((id) => (
          <button key={id} type="button" onClick={() => setThemeId(id)}>
            {id}
          </button>
        ))}
      </div>
      <div style={{ height: 360 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          theme={themeId}
          mode="dark"
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
  registerTheme,
  neonTheme,
  type ThemeDefinition,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const ocean: ThemeDefinition = {
  id: "ocean",
  modes: {
    dark: {
      background: "#0b1c24",
      grid: "#1e3a46",
      axisTick: "#5b8a9a",
      axisText: "#c8e6ef",
      crosshair: "#4fc3f7",
      crosshairLabelBg: "#0277bd",
      crosshairLabelText: "#ffffff",
      up: "#26c6da",
      down: "#ef5350",
      accent: "#29b6f6",
    },
    light: {
      background: "#f3fafc",
      grid: "#cfd8dc",
      axisTick: "#78909c",
      axisText: "#263238",
      crosshair: "#0288d1",
      crosshairLabelBg: "#0277bd",
      crosshairLabelText: "#ffffff",
      up: "#00838f",
      down: "#e53935",
      accent: "#039be5",
    },
  },
};

registerTheme(neonTheme);
registerTheme(ocean);

type ThemeId = "default" | "neon" | "ocean";
const themeId = ref<ThemeId>("ocean");
const ids: ThemeId[] = ["default", "neon", "ocean"];

const bg = computed(() =>
  themeId.value === "neon"
    ? "#0a0a12"
    : themeId.value === "ocean"
      ? "#0b1c24"
      : "#131722",
);
</script>

<template>
  <div style="width: 100%; height: 420px" :style="{ background: bg }">
    <div style="display: flex; gap: 8px; padding: 8px">
      <button
        v-for="id in ids"
        :key="id"
        type="button"
        @click="themeId = id"
      >
        {{ id }}
      </button>
    </div>
    <div style="height: 360px">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        resolution="1"
        :theme="themeId"
        mode="dark"
      />
    </div>
  </div>
</template>
`),
};

/** 涨跌极性 green-up / red-up */
export const runnableThemeUpDown: ExampleFiles = {
  react: reactKlineFiles(`import { useState } from "react";
import { KeisenChart, type UpDownScheme } from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

export default function App() {
  const [upDown, setUpDown] = useState<UpDownScheme>("green-up");

  return (
    <div style={{ width: "100%", height: 420, background: "#131722" }}>
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        <button type="button" onClick={() => setUpDown("green-up")}>
          green-up
        </button>
        <button type="button" onClick={() => setUpDown("red-up")}>
          red-up
        </button>
      </div>
      <div style={{ height: 360 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          mode="dark"
          upDown={upDown}
          onUpDownChange={setUpDown}
        />
      </div>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import { ref } from "vue";
import { KeisenChart, type UpDownScheme } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const upDown = ref<UpDownScheme>("green-up");
</script>

<template>
  <div style="width: 100%; height: 420px; background: #131722">
    <div style="display: flex; gap: 8px; padding: 8px">
      <button type="button" @click="upDown = 'green-up'">green-up</button>
      <button type="button" @click="upDown = 'red-up'">red-up</button>
    </div>
    <div style="height: 360px">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        resolution="1"
        mode="dark"
        :up-down="upDown"
        @up-down-change="upDown = $event"
      />
    </div>
  </div>
</template>
`),
};
