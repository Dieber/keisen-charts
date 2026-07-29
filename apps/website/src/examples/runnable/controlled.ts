import type { ExampleFiles } from "../../components/SandpackDemo";
import {
  KLINE_MODULE,
  KLINE_PATH_VUE,
  reactKlineFiles,
} from "../../data/kline";

/** 非受控：App 只传可选初值；图内 header 用 hook 切换全部偏好 */
export const runnableUncontrolled: ExampleFiles = {
  react: reactKlineFiles(`import { type CSSProperties } from "react";
import {
  KeisenChart,
  useKlineResolution,
  useKlineTheme,
  useKlineTimezone,
  useKlineLocale,
  type Resolution,
  type ThemeMode,
  type UpDownScheme,
  type KlineTimezone,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const RESOLUTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];
const THEMES = ["default", "neon"] as const;
const MODES: ThemeMode[] = ["light", "dark"];
const UP_DOWNS: UpDownScheme[] = ["green-up", "red-up"];
const TIMEZONES: KlineTimezone[] = ["UTC", "local"];
const LOCALES = ["zh-CN", "en-US"] as const;

const row: CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "6px 8px",
  flexWrap: "wrap",
  alignItems: "center",
  fontSize: 12,
};

function PrefToolbar() {
  const { resolution, setResolution } = useKlineResolution();
  const { themeId, setTheme, mode, setMode, upDown, setUpDown } =
    useKlineTheme();
  const { timezone, setTimezone } = useKlineTimezone();
  const { locale, setLocale } = useKlineLocale();

  return (
    <div style={row}>
      {RESOLUTIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setResolution(r)}
          style={{ fontWeight: resolution === r ? 700 : 400 }}
        >
          {r}
        </button>
      ))}
      <span>|</span>
      {THEMES.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          style={{ fontWeight: themeId === id ? 700 : 400 }}
        >
          {id}
        </button>
      ))}
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          style={{ fontWeight: mode === m ? 700 : 400 }}
        >
          {m}
        </button>
      ))}
      {UP_DOWNS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setUpDown(s)}
          style={{ fontWeight: upDown === s ? 700 : 400 }}
        >
          {s}
        </button>
      ))}
      <span>|</span>
      {TIMEZONES.map((tz) => (
        <button
          key={tz}
          type="button"
          onClick={() => setTimezone(tz)}
          style={{ fontWeight: timezone === tz ? 700 : 400 }}
        >
          {tz}
        </button>
      ))}
      {LOCALES.map((id) => (
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
    <div style={{ width: "100%", height: 460 }}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        theme="default"
        mode="light"
        upDown="green-up"
        timezone="UTC"
        locale="zh-CN"
        header={<PrefToolbar />}
      />
    </div>
  );
}
`),
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import { KeisenChart } from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";
import PrefToolbar from "./PrefToolbar.vue";
</script>

<template>
  <div style="width: 100%; height: 460px">
    <KeisenChart
      :get-data="getKlineData"
      :on-subscribe="subscribeKline"
      symbol="BTCUSDT"
      resolution="1"
      theme="default"
      mode="light"
      up-down="green-up"
      timezone="UTC"
      locale="zh-CN"
    >
      <template #header>
        <PrefToolbar />
      </template>
    </KeisenChart>
  </div>
</template>
`,
    "/src/PrefToolbar.vue": `<script setup lang="ts">
import {
  useKlineResolution,
  useKlineTheme,
  useKlineTimezone,
  useKlineLocale,
  type Resolution,
  type ThemeMode,
  type UpDownScheme,
  type KlineTimezone,
} from "@keisen-charts/vue";

const RESOLUTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];
const THEMES = ["default", "neon"] as const;
const MODES: ThemeMode[] = ["light", "dark"];
const UP_DOWNS: UpDownScheme[] = ["green-up", "red-up"];
const TIMEZONES: KlineTimezone[] = ["UTC", "local"];
const LOCALES = ["zh-CN", "en-US"] as const;

const { resolution, setResolution } = useKlineResolution();
const { themeId, setTheme, mode, setMode, upDown, setUpDown } = useKlineTheme();
const { timezone, setTimezone } = useKlineTimezone();
const { locale, setLocale } = useKlineLocale();
</script>

<template>
  <div
    style="display:flex;gap:6px;padding:6px 8px;flex-wrap:wrap;align-items:center;font-size:12px"
  >
    <button
      v-for="r in RESOLUTIONS"
      :key="r"
      type="button"
      :style="{ fontWeight: resolution === r ? 700 : 400 }"
      @click="setResolution(r)"
    >
      {{ r }}
    </button>
    <span>|</span>
    <button
      v-for="id in THEMES"
      :key="id"
      type="button"
      :style="{ fontWeight: themeId === id ? 700 : 400 }"
      @click="setTheme(id)"
    >
      {{ id }}
    </button>
    <button
      v-for="m in MODES"
      :key="m"
      type="button"
      :style="{ fontWeight: mode === m ? 700 : 400 }"
      @click="setMode(m)"
    >
      {{ m }}
    </button>
    <button
      v-for="s in UP_DOWNS"
      :key="s"
      type="button"
      :style="{ fontWeight: upDown === s ? 700 : 400 }"
      @click="setUpDown(s)"
    >
      {{ s }}
    </button>
    <span>|</span>
    <button
      v-for="tz in TIMEZONES"
      :key="tz"
      type="button"
      :style="{ fontWeight: timezone === tz ? 700 : 400 }"
      @click="setTimezone(tz)"
    >
      {{ tz }}
    </button>
    <button
      v-for="id in LOCALES"
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

/** 受控：App 持有全部偏好 state；prop + onChange 双向同步 */
export const runnableControlled: ExampleFiles = {
  react: reactKlineFiles(`import { useState, type CSSProperties } from "react";
import {
  KeisenChart,
  type Resolution,
  type ThemeMode,
  type UpDownScheme,
  type KlineTimezone,
  type ThemeInput,
} from "@keisen-charts/react";
import { getKlineData, subscribeKline } from "./kline";

const RESOLUTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];
const THEMES = ["default", "neon"] as const;
const MODES: ThemeMode[] = ["light", "dark"];
const UP_DOWNS: UpDownScheme[] = ["green-up", "red-up"];
const TIMEZONES: KlineTimezone[] = ["UTC", "local"];
const LOCALES = ["zh-CN", "en-US"] as const;

const row: CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "6px 8px",
  flexWrap: "wrap",
  alignItems: "center",
  fontSize: 12,
};

export default function App() {
  const [resolution, setResolution] = useState<Resolution>("1");
  const [theme, setTheme] = useState<ThemeInput>("default");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [upDown, setUpDown] = useState<UpDownScheme>("green-up");
  const [timezone, setTimezone] = useState<KlineTimezone>("UTC");
  const [locale, setLocale] = useState("zh-CN");

  const themeId = typeof theme === "string" ? theme : "custom";

  return (
    <div
      style={{
        width: "100%",
        height: 460,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={row}>
        {RESOLUTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResolution(r)}
            style={{ fontWeight: resolution === r ? 700 : 400 }}
          >
            {r}
          </button>
        ))}
        <span>|</span>
        {THEMES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            style={{ fontWeight: themeId === id ? 700 : 400 }}
          >
            {id}
          </button>
        ))}
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ fontWeight: mode === m ? 700 : 400 }}
          >
            {m}
          </button>
        ))}
        {UP_DOWNS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setUpDown(s)}
            style={{ fontWeight: upDown === s ? 700 : 400 }}
          >
            {s}
          </button>
        ))}
        <span>|</span>
        {TIMEZONES.map((tz) => (
          <button
            key={tz}
            type="button"
            onClick={() => setTimezone(tz)}
            style={{ fontWeight: timezone === tz ? 700 : 400 }}
          >
            {tz}
          </button>
        ))}
        {LOCALES.map((id) => (
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution={resolution}
          onResolutionChange={setResolution}
          theme={theme}
          onThemeChange={setTheme}
          mode={mode}
          onModeChange={setMode}
          upDown={upDown}
          onUpDownChange={setUpDown}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          locale={locale}
          onLocaleChange={setLocale}
        />
      </div>
    </div>
  );
}
`),
  vue: {
    "/src/App.vue": `<script setup lang="ts">
import { ref, computed } from "vue";
import {
  KeisenChart,
  type Resolution,
  type ThemeMode,
  type UpDownScheme,
  type KlineTimezone,
  type ThemeInput,
} from "@keisen-charts/vue";
import { getKlineData, subscribeKline } from "./kline";

const RESOLUTIONS: Resolution[] = ["1", "5", "15", "60", "1D"];
const THEMES = ["default", "neon"] as const;
const MODES: ThemeMode[] = ["light", "dark"];
const UP_DOWNS: UpDownScheme[] = ["green-up", "red-up"];
const TIMEZONES: KlineTimezone[] = ["UTC", "local"];
const LOCALES = ["zh-CN", "en-US"] as const;

const resolution = ref<Resolution>("1");
const theme = ref<ThemeInput>("default");
const mode = ref<ThemeMode>("light");
const upDown = ref<UpDownScheme>("green-up");
const timezone = ref<KlineTimezone>("UTC");
const locale = ref("zh-CN");

const themeId = computed(() =>
  typeof theme.value === "string" ? theme.value : "custom",
);
</script>

<template>
  <div
    style="width: 100%; height: 460px; display: flex; flex-direction: column"
  >
    <div
      style="display:flex;gap:6px;padding:6px 8px;flex-wrap:wrap;align-items:center;font-size:12px"
    >
      <button
        v-for="r in RESOLUTIONS"
        :key="r"
        type="button"
        :style="{ fontWeight: resolution === r ? 700 : 400 }"
        @click="resolution = r"
      >
        {{ r }}
      </button>
      <span>|</span>
      <button
        v-for="id in THEMES"
        :key="id"
        type="button"
        :style="{ fontWeight: themeId === id ? 700 : 400 }"
        @click="theme = id"
      >
        {{ id }}
      </button>
      <button
        v-for="m in MODES"
        :key="m"
        type="button"
        :style="{ fontWeight: mode === m ? 700 : 400 }"
        @click="mode = m"
      >
        {{ m }}
      </button>
      <button
        v-for="s in UP_DOWNS"
        :key="s"
        type="button"
        :style="{ fontWeight: upDown === s ? 700 : 400 }"
        @click="upDown = s"
      >
        {{ s }}
      </button>
      <span>|</span>
      <button
        v-for="tz in TIMEZONES"
        :key="tz"
        type="button"
        :style="{ fontWeight: timezone === tz ? 700 : 400 }"
        @click="timezone = tz"
      >
        {{ tz }}
      </button>
      <button
        v-for="id in LOCALES"
        :key="id"
        type="button"
        :style="{ fontWeight: locale === id ? 700 : 400 }"
        @click="locale = id"
      >
        {{ id }}
      </button>
    </div>
    <div style="flex: 1; min-height: 0">
      <KeisenChart
        :get-data="getKlineData"
        :on-subscribe="subscribeKline"
        symbol="BTCUSDT"
        :resolution="resolution"
        :theme="theme"
        :mode="mode"
        :up-down="upDown"
        :timezone="timezone"
        :locale="locale"
        @resolution-change="resolution = $event"
        @theme-change="theme = $event"
        @mode-change="mode = $event"
        @up-down-change="upDown = $event"
        @timezone-change="timezone = $event"
        @locale-change="locale = $event"
      />
    </div>
  </div>
</template>
`,
    [KLINE_PATH_VUE]: KLINE_MODULE,
  },
};
