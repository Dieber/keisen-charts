import type { ExampleFiles } from "../../components/SandpackDemo";
import {
  KLINE_MODULE,
  KLINE_PATH,
  KLINE_PATH_VUE,
  reactKlineFiles,
  vueKlineFiles,
} from "../../data/kline";
import { INDICATOR_PANEL_CSS } from "./indicatorPanelCss";
import { REACT_INDICATOR_PANEL } from "./indicatorPanelReact";
import {
  VUE_INDICATOR_PANEL,
  VUE_INDICATOR_TOOLBAR,
} from "./indicatorPanelVue";

export const runnablePanes: ExampleFiles = {
  react: reactKlineFiles(`import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  MA,
  VolumeChart,
  VOL,
  MAVOL,
  MACDChart,
  DIF,
  DEA,
  MACD,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

export default function App() {
  return (
    <div style={{ width: "100%", height: 520 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
      >
        <MainKlineChart>
          <KlineCandles />
          <MA period={10} />
        </MainKlineChart>
        <VolumeChart>
          <VOL />
          <MAVOL period={5} />
        </VolumeChart>
        <MACDChart>
          <DIF />
          <DEA />
          <MACD />
        </MACDChart>
      </KeisenChart>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  MA,
  VolumeChart,
  VOL,
  MAVOL,
  MACDChart,
  DIF,
  DEA,
  MACD,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
</script>

<template>
  <div style="width: 100%; height: 520px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    >
      <MainKlineChart>
        <KlineCandles />
        <MA :period="10" />
      </MainKlineChart>
      <VolumeChart>
        <VOL />
        <MAVOL :period="5" />
      </VolumeChart>
      <MACDChart>
        <DIF />
        <DEA />
        <MACD />
      </MACDChart>
    </KeisenChart>
  </div>
</template>
`),
};

const INDICATOR_DEFAULTS = `{
      ma: { visible: true },
      ema: { visible: false },
      smma: { visible: false },
      boll: { visible: false },
      sar: { visible: false },
      volume: { visible: true },
      macd: { visible: true },
      rsi: { visible: false },
      kdj: { visible: false },
      obv: { visible: false },
      cci: { visible: false },
      wr: { visible: false },
      dmi: { visible: false },
      mtm: { visible: false },
    }`;

/** useKlineIndicator：工具栏 popup 管理显隐 / 子线颜色，并动态组装主图 + 副图 */
export const runnablePanesIndicator: ExampleFiles = {
  react: {
    "/App.tsx": `import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
} from "@keisen-charts/react";
import { useKlineIndicator } from "@keisen-charts/react/toolkit";
import { getKlineData, subscribeKline } from "./kline";
import { IndicatorToolbar } from "./IndicatorSettingsPanel";

export default function App() {
  const indicator = useKlineIndicator({
    defaults: ${INDICATOR_DEFAULTS},
  });

  return (
    <div style={{ width: "100%", height: 520 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
        header={
          <div style={{ padding: 8 }}>
            <IndicatorToolbar panelProps={indicator.panelProps} />
          </div>
        }
      >
        <MainKlineChart>
          <KlineCandles />
          {indicator.mainLayers}
        </MainKlineChart>
        {indicator.paneCharts}
      </KeisenChart>
    </div>
  );
}
`,
    "/IndicatorSettingsPanel.tsx": REACT_INDICATOR_PANEL,
    "/indicator-panel.css": INDICATOR_PANEL_CSS,
    [KLINE_PATH]: KLINE_MODULE,
  },
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  VNodes,
} from "@keisen-charts/vue";
import { useKlineIndicator } from "@keisen-charts/vue/toolkit";
import { getKlineData, subscribeKline } from "./kline";
import IndicatorToolbar from "./IndicatorToolbar.vue";
import "./indicator-panel.css";

const { panelProps, mainLayers, paneCharts } = useKlineIndicator({
  defaults: ${INDICATOR_DEFAULTS},
});
</script>

<template>
  <div style="width: 100%; height: 520px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    >
      <template #header>
        <div style="padding: 8px">
          <IndicatorToolbar :panel-props="panelProps" />
        </div>
      </template>
      <MainKlineChart>
        <KlineCandles />
        <VNodes :nodes="mainLayers" />
      </MainKlineChart>
      <VNodes :nodes="paneCharts" />
    </KeisenChart>
  </div>
</template>
`,
    "/src/IndicatorToolbar.vue": VUE_INDICATOR_TOOLBAR,
    "/src/IndicatorSettingsPanel.vue": VUE_INDICATOR_PANEL,
    "/src/indicator-panel.css": INDICATOR_PANEL_CSS,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  },
};
export const runnableIndicators: ExampleFiles = {
  react: reactKlineFiles(`import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  registerIndicator,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const BiasChart = registerIndicator({
  name: "Bias",
  placement: "pane",
  yDomainPolicy: "extentIncludeZero",
  calcParams: { period: 6 },
  figures: [{ key: "bias", type: "line", style: { color: "#ae3ec9" } }],
  calc: (kline, params) => {
    const period =
      typeof params === "object" &&
      !Array.isArray(params) &&
      typeof params.period === "number"
        ? params.period
        : 6;
    const bias: (number | null)[] = kline.map(() => null);
    for (let i = period - 1; i < kline.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += kline[j]!.c;
      const ma = sum / period;
      bias[i] = ma === 0 ? 0 : ((kline[i]!.c - ma) / ma) * 100;
    }
    return { bias };
  },
});

export default function App() {
  return (
    <div style={{ width: "100%", height: 480 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
      >
        <MainKlineChart>
          <KlineCandles />
        </MainKlineChart>
        <BiasChart />
      </KeisenChart>
    </div>
  );
}
`),
  vue: vueKlineFiles(`<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  registerIndicator,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const BiasChart = registerIndicator({
  name: "Bias",
  placement: "pane",
  yDomainPolicy: "extentIncludeZero",
  calcParams: { period: 6 },
  figures: [{ key: "bias", type: "line", style: { color: "#ae3ec9" } }],
  calc: (kline, params) => {
    const period =
      typeof params === "object" &&
      !Array.isArray(params) &&
      typeof params.period === "number"
        ? params.period
        : 6;
    const bias = kline.map(() => null);
    for (let i = period - 1; i < kline.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += kline[j].c;
      const ma = sum / period;
      bias[i] = ma === 0 ? 0 : ((kline[i].c - ma) / ma) * 100;
    }
    return { bias };
  },
});
</script>

<template>
  <div style="width: 100%; height: 480px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    >
      <MainKlineChart>
        <KlineCandles />
      </MainKlineChart>
      <BiasChart />
    </KeisenChart>
  </div>
</template>
`),
};
