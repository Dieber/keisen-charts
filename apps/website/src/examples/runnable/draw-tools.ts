import type { ExampleFiles } from "../../components/SandpackDemo";
import {
  KLINE_MODULE,
  KLINE_PATH_VUE,
  reactKlineFiles,
} from "../../data/kline";

/** 程序化 addDrawing */
export const runnableDrawByCode: ExampleFiles = {
  react: reactKlineFiles(`import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  useKlineData,
} from "@keisen-charts/react";
import { useDrawOverlay } from "@keisen-charts/react/toolkit";
import { getKlineData, subscribeKline } from "./kline";

function DrawControls() {
  const { data } = useKlineData();
  const { addDrawing, clearDrawings, drawings, removeDrawing } =
    useDrawOverlay();

  const addSamples = () => {
    const kline = data.kline;
    if (kline.length < 2) return;
    const last = kline[kline.length - 1]!;
    const mid = kline[Math.floor(kline.length / 2)]!;

    addDrawing({
      tool: "horizontal",
      paneId: "main",
      points: [{ barIndex: kline.length - 1, value: last.c, time: last.t }],
      style: { stroke: "#e11d48", lineWidth: 2 },
    });

    addDrawing({
      tool: "ray",
      paneId: "main",
      points: [
        { barIndex: Math.floor(kline.length / 2), value: mid.c, time: mid.t },
        { barIndex: kline.length - 1, value: last.c, time: last.t },
      ],
      style: { stroke: "#2563eb", lineWidth: 1.5 },
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, padding: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="button" onClick={addSamples}>
        添加水平线 + 射线
      </button>
      <button type="button" onClick={() => clearDrawings()}>
        清空
      </button>
      <span style={{ fontSize: 12, color: "#666" }}>
        当前 {drawings.length} 根
      </span>
      {drawings.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => removeDrawing(d.id)}
          style={{ fontSize: 12 }}
        >
          删 {d.tool}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: "100%", height: 460 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
        header={<DrawControls />}
      >
        <MainKlineChart>
          <KlineCandles />
        </MainKlineChart>
      </KeisenChart>
    </div>
  );
}
`),
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
import DrawControls from "./DrawControls.vue";
</script>

<template>
  <div style="width: 100%; height: 460px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    >
      <template #header>
        <DrawControls />
      </template>
      <MainKlineChart>
        <KlineCandles />
      </MainKlineChart>
    </KeisenChart>
  </div>
</template>
`,
    "/src/DrawControls.vue": `<script setup lang="ts">
import { useKlineData } from "@keisen-charts/vue";
import { useDrawOverlay } from "@keisen-charts/vue/toolkit";

const { data } = useKlineData();
const { addDrawing, clearDrawings, drawings, removeDrawing } =
  useDrawOverlay();

const addSamples = () => {
  const kline = data.value.kline;
  if (kline.length < 2) return;
  const last = kline[kline.length - 1]!;
  const mid = kline[Math.floor(kline.length / 2)]!;

  addDrawing({
    tool: "horizontal",
    paneId: "main",
    points: [{ barIndex: kline.length - 1, value: last.c, time: last.t }],
    style: { stroke: "#e11d48", lineWidth: 2 },
  });

  addDrawing({
    tool: "ray",
    paneId: "main",
    points: [
      { barIndex: Math.floor(kline.length / 2), value: mid.c, time: mid.t },
      { barIndex: kline.length - 1, value: last.c, time: last.t },
    ],
    style: { stroke: "#2563eb", lineWidth: 1.5 },
  });
};
</script>

<template>
  <div style="display:flex;gap:8px;padding:8px;flex-wrap:wrap;align-items:center">
    <button type="button" @click="addSamples">添加水平线 + 射线</button>
    <button type="button" @click="clearDrawings()">清空</button>
    <span style="font-size:12px;color:#666">当前 {{ drawings.length }} 根</span>
    <button
      v-for="d in drawings"
      :key="d.id"
      type="button"
      style="font-size:12px"
      @click="removeDrawing(d.id)"
    >
      删 {{ d.tool }}
    </button>
  </div>
</template>
`,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  },
};

/** 工具条 setOverlay + 图上点选 */
export const runnableDrawByTool: ExampleFiles = {
  react: reactKlineFiles(`import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
} from "@keisen-charts/react";
import { useDrawOverlay } from "@keisen-charts/react/toolkit";
import { getKlineData, subscribeKline } from "./kline";

/** 可复制的简易工具条：选工具 → 在图上点击落笔 */
function DrawToolbar() {
  const { toolbarProps, stickyTool, setStickyTool, drawings } =
    useDrawOverlay();
  const { tools, activeTool, setOverlay, clearDrawings } = toolbarProps;

  return (
    <div style={{ display: "flex", gap: 6, padding: 8, flexWrap: "wrap", alignItems: "center" }}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => setOverlay(activeTool === tool.id ? null : tool.id)}
          style={{ fontWeight: activeTool === tool.id ? 700 : 400 }}
        >
          {tool.label}
        </button>
      ))}
      <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={stickyTool}
          onChange={(e) => setStickyTool(e.target.checked)}
        />
        连续画
      </label>
      <button type="button" onClick={() => clearDrawings()}>
        清空
      </button>
      <span style={{ fontSize: 12, color: "#666" }}>
        {activeTool
          ? \`请在图上点击完成「\${tools.find((t) => t.id === activeTool)?.label}」\`
          : \`浏览中 · \${drawings.length} 根\`}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: "100%", height: 460 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode="light"
        header={<DrawToolbar />}
      >
        <MainKlineChart>
          <KlineCandles />
        </MainKlineChart>
      </KeisenChart>
    </div>
  );
}
`),
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
import DrawToolbar from "./DrawToolbar.vue";
</script>

<template>
  <div style="width: 100%; height: 460px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      mode="light"
    >
      <template #header>
        <DrawToolbar />
      </template>
      <MainKlineChart>
        <KlineCandles />
      </MainKlineChart>
    </KeisenChart>
  </div>
</template>
`,
    "/src/DrawToolbar.vue": `<script setup lang="ts">
import { computed } from "vue";
import { useDrawOverlay, type DrawingToolId } from "@keisen-charts/vue/toolkit";

const { toolbarProps, stickyTool, setStickyTool, drawings } =
  useDrawOverlay();

const tools = computed(() => toolbarProps.value.tools);
const activeTool = computed(() => toolbarProps.value.activeTool);
const setOverlay = (tool: DrawingToolId | null) =>
  toolbarProps.value.setOverlay(tool);
const clearDrawings = () => toolbarProps.value.clearDrawings();
const onStickyChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  setStickyTool(input.checked);
};

const hint = computed(() => {
  if (!activeTool.value) return \`浏览中 · \${drawings.value.length} 根\`;
  const label = tools.value.find((t) => t.id === activeTool.value)?.label;
  return \`请在图上点击完成「\${label}」\`;
});
</script>

<template>
  <div style="display:flex;gap:6px;padding:8px;flex-wrap:wrap;align-items:center">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      :style="{ fontWeight: activeTool === tool.id ? 700 : 400 }"
      @click="setOverlay(activeTool === tool.id ? null : tool.id)"
    >
      {{ tool.label }}
    </button>
    <label style="font-size:12px;display:flex;gap:4px;align-items:center">
      <input
        type="checkbox"
        :checked="stickyTool"
        @change="onStickyChange"
      />
      连续画
    </label>
    <button type="button" @click="clearDrawings()">清空</button>
    <span style="font-size:12px;color:#666">{{ hint }}</span>
  </div>
</template>
`,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  },
};
