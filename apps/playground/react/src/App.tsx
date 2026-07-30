import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  formatCompactTiny,
  createPriceFormatter,
  registerIndicator,
  useKlineResolution,
  useKlineTheme,
  useKlineTimezone,
  useKlineLocale,
  type ChartPointerInfo,
} from "@keisen-charts/react";
import type { PriceFormat, Resolution } from "@keisen-charts/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { binanceGetData } from "./api/binanceCandles";
import { binanceOnSubscribe } from "./api/binanceStream";
import {
  IndicatorSettingsPanel,
  useKlineIndicator,
  type IndicatorPanelProps,
} from "./toolkits/indicator";
import { DrawToolsToolbar, useDrawOverlay } from "./toolkits/draw-tools";

const SYMBOL_OPTIONS = [
  { label: "XRP", value: "XRPUSDT" },
  { label: "BTC", value: "BTCUSDT" },
] as const;

type SymbolId = (typeof SYMBOL_OPTIONS)[number]["value"];

const SYMBOL_PRICE_FORMAT: Record<SymbolId, PriceFormat> = {
  XRPUSDT: {
    type: "price",
    minMove: 0.0001,
    precision: 4,
    useGrouping: false,
  },
  BTCUSDT: {
    type: "price",
    minMove: 0.1,
    precision: 1,
  },
};

/** demo：极小数 compact（0.0{n}xxx）；默认关闭，按需切换 */
const COMPACT_DEMO_FORMAT: PriceFormat = {
  type: "custom",
  minMove: 1e-12,
  formatter: (value, ctx) =>
    formatCompactTiny(value, { significantDigits: 4 }) ??
    createPriceFormatter({
      type: "price",
      precision: 12,
      useGrouping: false,
    })(value, ctx),
};

const RESOLUTION_OPTIONS: { label: string; value: Resolution }[] = [
  { label: "1m", value: "1" },
  { label: "3m", value: "3" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h", value: "60" },
  { label: "2h", value: "120" },
  { label: "4h", value: "240" },
  { label: "6h", value: "360" },
  { label: "12h", value: "720" },
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
];

const THEME_OPTIONS = [
  { label: "Default", value: "default" as const },
  { label: "Neon", value: "neon" as const },
];

const TIMEZONE_OPTIONS = [
  { label: "UTC", value: "UTC" as const },
  { label: "Local", value: "local" as const },
];

const LOCALE_OPTIONS = [
  { label: "中文", value: "zh-CN" },
  { label: "EN", value: "en-US" },
];

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

const BiasLine = (_props: { color?: string }) => null;
BiasLine.layerType = "Bias:bias";

function ThemeChrome({ children }: { children: ReactNode }) {
  const { mode, colors, themeId } = useKlineTheme();
  const pageBg =
    colors.background !== "transparent"
      ? colors.background
      : mode === "dark"
        ? "#0f0f0f"
        : "#f5f5f5";

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = pageBg;
    return () => {
      document.body.style.background = prev;
    };
  }, [pageBg]);

  return (
    <div className={`theme-${themeId}`}>
      <div
        className={`theme-chrome mode-${mode}`}
        style={{ background: pageBg }}
      >
        {children}
      </div>
    </div>
  );
}

function ChartToolbar({
  symbol,
  onSymbolChange,
  compactDemo,
  onCompactDemoChange,
  indicatorPanelProps,
  drawToolsOpen,
  onDrawToolsOpenChange,
}: {
  symbol: SymbolId;
  onSymbolChange: (symbol: SymbolId) => void;
  compactDemo: boolean;
  onCompactDemoChange: (value: boolean) => void;
  indicatorPanelProps: IndicatorPanelProps;
  drawToolsOpen: boolean;
  onDrawToolsOpenChange: (open: boolean) => void;
}) {
  const { resolution, setResolution } = useKlineResolution();
  const { themeId, setTheme, mode, setMode, upDown, setUpDown } =
    useKlineTheme();
  const { timezone, setTimezone } = useKlineTimezone();
  const { locale, setLocale } = useKlineLocale();
  const [indicatorOpen, setIndicatorOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const draw = useDrawOverlay();

  useEffect(() => {
    if (!indicatorOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!hostRef.current?.contains(event.target as Node)) {
        setIndicatorOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndicatorOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [indicatorOpen]);

  const toggleDrawTools = () => {
    if (drawToolsOpen) draw.setOverlay(null);
    onDrawToolsOpenChange(!drawToolsOpen);
  };

  return (
    <ThemeChrome>
      <div className="toolbar">
        <div className="toolbar-group">
          {SYMBOL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={symbol === option.value ? "active" : undefined}
              onClick={() => onSymbolChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            aria-label="周期"
            value={resolution}
            onChange={(event) =>
              setResolution(event.target.value as Resolution)
            }
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          {TIMEZONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={timezone === option.value ? "active" : undefined}
              onClick={() => setTimezone(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={locale === option.value ? "active" : undefined}
              onClick={() => setLocale(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={themeId === option.value ? "active" : undefined}
              onClick={() => setTheme(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="toolbar-group">
          <button
            type="button"
            className={mode === "dark" ? "active" : undefined}
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          >
            {mode === "dark" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            className={upDown === "red-up" ? "active" : undefined}
            onClick={() =>
              setUpDown(upDown === "green-up" ? "red-up" : "green-up")
            }
          >
            {upDown === "green-up" ? "绿涨" : "红涨"}
          </button>
        </div>
        <div className="toolbar-group indicator-panel-host" ref={hostRef}>
          <button
            type="button"
            className={indicatorOpen ? "active" : undefined}
            aria-expanded={indicatorOpen}
            onClick={() => setIndicatorOpen((value) => !value)}
          >
            指标设置
          </button>
          {indicatorOpen ? (
            <div className="indicator-panel-shell">
              <IndicatorSettingsPanel
                {...indicatorPanelProps}
                onConfirm={() => setIndicatorOpen(false)}
              />
            </div>
          ) : null}
        </div>
        <div className="toolbar-group">
          <button
            type="button"
            className={drawToolsOpen ? "active" : undefined}
            aria-pressed={drawToolsOpen}
            onClick={toggleDrawTools}
          >
            画线
          </button>
        </div>
        <div className="toolbar-group">
          <button
            type="button"
            className={compactDemo ? "active" : undefined}
            onClick={() => onCompactDemoChange(!compactDemo)}
            title="演示 custom formatter：0.0{n}xxx"
          >
            Compact
          </button>
        </div>
      </div>
      {drawToolsOpen ? (
        <aside className="draw-tools-rail" aria-label="画线工具栏">
          <DrawToolsToolbar {...draw.toolbarProps} />
        </aside>
      ) : null}
    </ThemeChrome>
  );
}

export function App() {
  const [symbol, setSymbol] = useState<SymbolId>("XRPUSDT");
  const [compactDemo, setCompactDemo] = useState(false);
  const [drawToolsOpen, setDrawToolsOpen] = useState(true);
  const [pointerHud, setPointerHud] = useState<string>("pointer: —");

  const priceFormat = useMemo(
    () => (compactDemo ? COMPACT_DEMO_FORMAT : SYMBOL_PRICE_FORMAT[symbol]),
    [compactDemo, symbol],
  );

  const indicator = useKlineIndicator({
    extras: [
      {
        id: "bias",
        meta: {
          group: "pane",
          label: "BIAS",
          colorLabels: { bias: "BIAS" },
          paramFields: [
            { key: "period", label: "周期", kind: "number", min: 1, step: 1 },
          ],
        },
        defaultSetting: {
          visible: false,
          colors: { bias: "#ae3ec9" },
          params: { period: 6 },
        },
        createChart: (setting) => {
          const period =
            typeof setting.params?.period === "number"
              ? setting.params.period
              : 6;
          return (
            <BiasChart key="bias" renderer="canvas" period={period}>
              <BiasLine color={setting.colors.bias} />
            </BiasChart>
          );
        },
      },
    ],
  });

  const formatPointerHud = (info: ChartPointerInfo | null) => {
    if (!info) return "pointer: —";
    const t = new Date(info.timestamp).toISOString().slice(11, 19);
    return `pointer: ${info.chartId}  x=${info.x.toFixed(0)} y=${info.y.toFixed(0)}  t=${t}  v=${info.value.toPrecision(6)}  bar=${info.barIndex}`;
  };

  return (
    <div
      className={
        drawToolsOpen ? "chart-container draw-tools-open" : "chart-container"
      }
    >
      <div className="pointer-hud">{pointerHud}</div>
      <KeisenChart
        symbol={symbol}
        resolution={"1"}
        getData={binanceGetData}
        onSubscribe={binanceOnSubscribe}
        priceFormat={priceFormat}
        onPointerMove={(info) => setPointerHud(formatPointerHud(info))}
        onClick={(info) => {
          console.log("[chart click]", info);
          setPointerHud(`click: ${formatPointerHud(info)}`);
        }}
        header={
          <ChartToolbar
            symbol={symbol}
            onSymbolChange={setSymbol}
            compactDemo={compactDemo}
            onCompactDemoChange={setCompactDemo}
            indicatorPanelProps={indicator.panelProps}
            drawToolsOpen={drawToolsOpen}
            onDrawToolsOpenChange={setDrawToolsOpen}
          />
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

export default App;
