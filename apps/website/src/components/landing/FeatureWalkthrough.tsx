import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import Translate from "@docusaurus/Translate";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useColorMode } from "@docusaurus/theme-common";
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
  registerTheme,
  neonTheme,
  useKlineData,
  type Resolution,
  type ThemeMode,
} from "@keisen-charts/react";
import { useDrawOverlay } from "@keisen-charts/react/toolkit";

import {
  BTC_KLINES,
  getKlineData,
  subscribeKline,
  type DocKlineBar,
} from "../../data/kline";
import { chartLocaleFromSite } from "../../lib/chartLocale";
import styles from "./FeatureWalkthrough.module.css";

registerTheme(neonTheme);

const STEP_COUNT = 5;
const STEP_IDS = [
  "static",
  "dynamic",
  "theme",
  "indicators",
  "drawings",
] as const;

type StepId = (typeof STEP_IDS)[number];

type ChartChrome = {
  locale: string;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ChartChromeContext = createContext<ChartChrome | null>(null);

function useChartChrome(): ChartChrome {
  const ctx = useContext(ChartChromeContext);
  if (!ctx) throw new Error("useChartChrome outside provider");
  return ctx;
}

function useStickyStep(rootRef: RefObject<HTMLElement | null>) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setStep(0);
        return;
      }
      const scrolled = Math.min(
        total,
        Math.max(0, -el.getBoundingClientRect().top),
      );
      const progress = scrolled / total;
      const next = Math.min(
        STEP_COUNT - 1,
        Math.max(0, Math.floor(progress * STEP_COUNT)),
      );
      setStep((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [rootRef]);

  return step;
}

function ActionButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.actionBtn}${active ? ` ${styles.actionBtnActive}` : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StaticStep({
  slice,
  onSlice,
}: {
  slice: "full" | "half";
  onSlice: (v: "full" | "half") => void;
}) {
  const { locale, mode } = useChartChrome();
  const data: DocKlineBar[] =
    slice === "half"
      ? BTC_KLINES.slice(0, Math.floor(BTC_KLINES.length / 2))
      : BTC_KLINES;

  return (
    <>
      <div className={styles.actions}>
        <ActionButton active={slice === "full"} onClick={() => onSlice("full")}>
          <Translate id="landing.walkthrough.static.full">Full series</Translate>
        </ActionButton>
        <ActionButton active={slice === "half"} onClick={() => onSlice("half")}>
          <Translate id="landing.walkthrough.static.half">First half</Translate>
        </ActionButton>
      </div>
      <div className={styles.chart}>
        <KeisenChart data={data} resolution="1" mode={mode} locale={locale}>
          <MainKlineChart>
            <KlineCandles />
          </MainKlineChart>
        </KeisenChart>
      </div>
    </>
  );
}

function DynamicStep({
  symbol,
  resolution,
  onSymbol,
  onResolution,
}: {
  symbol: string;
  resolution: Resolution;
  onSymbol: (s: string) => void;
  onResolution: (r: Resolution) => void;
}) {
  const { locale, mode } = useChartChrome();
  return (
    <>
      <div className={styles.actions}>
        <ActionButton
          active={symbol === "BTCUSDT"}
          onClick={() => onSymbol("BTCUSDT")}
        >
          BTC
        </ActionButton>
        <ActionButton
          active={symbol === "ETHUSDT"}
          onClick={() => onSymbol("ETHUSDT")}
        >
          ETH
        </ActionButton>
        {(["1", "5", "60"] as Resolution[]).map((r) => (
          <ActionButton
            key={r}
            active={resolution === r}
            onClick={() => onResolution(r)}
          >
            {r === "60" ? "1h" : `${r}m`}
          </ActionButton>
        ))}
      </div>
      <div className={styles.chart}>
        <KeisenChart
          key={`${symbol}-${resolution}`}
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol={symbol}
          resolution={resolution}
          mode={mode}
          locale={locale}
        >
          <MainKlineChart>
            <KlineCandles />
          </MainKlineChart>
        </KeisenChart>
      </div>
    </>
  );
}

function ThemeStep({
  themeId,
  onTheme,
}: {
  themeId: "default" | "neon";
  onTheme: (t: "default" | "neon") => void;
}) {
  const { locale, mode, setMode } = useChartChrome();
  const bg =
    themeId === "neon"
      ? "#0a0a12"
      : mode === "dark"
        ? "#131722"
        : "#ffffff";

  return (
    <>
      <div className={styles.actions}>
        <ActionButton
          active={mode === "light"}
          onClick={() => setMode("light")}
        >
          <Translate id="landing.walkthrough.theme.light">Light</Translate>
        </ActionButton>
        <ActionButton active={mode === "dark"} onClick={() => setMode("dark")}>
          <Translate id="landing.walkthrough.theme.dark">Dark</Translate>
        </ActionButton>
        <ActionButton
          active={themeId === "default"}
          onClick={() => onTheme("default")}
        >
          Default
        </ActionButton>
        <ActionButton
          active={themeId === "neon"}
          onClick={() => onTheme("neon")}
        >
          Neon
        </ActionButton>
      </div>
      <div className={styles.chart} style={{ background: bg }}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          theme={themeId}
          mode={mode}
          locale={locale}
        >
          <MainKlineChart>
            <KlineCandles />
          </MainKlineChart>
        </KeisenChart>
      </div>
    </>
  );
}

function IndicatorsStep({
  showMa,
  showVolume,
  showMacd,
  onToggleMa,
  onToggleVolume,
  onToggleMacd,
}: {
  showMa: boolean;
  showVolume: boolean;
  showMacd: boolean;
  onToggleMa: () => void;
  onToggleVolume: () => void;
  onToggleMacd: () => void;
}) {
  const { locale, mode } = useChartChrome();
  return (
    <>
      <div className={styles.actions}>
        <ActionButton active={showMa} onClick={onToggleMa}>
          MA
        </ActionButton>
        <ActionButton active={showVolume} onClick={onToggleVolume}>
          Volume
        </ActionButton>
        <ActionButton active={showMacd} onClick={onToggleMacd}>
          MACD
        </ActionButton>
      </div>
      <div className={styles.chart}>
        <KeisenChart
          getData={getKlineData}
          onSubscribe={subscribeKline}
          symbol="BTCUSDT"
          resolution="1"
          mode={mode}
          locale={locale}
        >
          <MainKlineChart>
            <KlineCandles />
            {showMa ? <MA period={10} /> : null}
          </MainKlineChart>
          {showVolume ? (
            <VolumeChart>
              <VOL />
              <MAVOL period={5} />
            </VolumeChart>
          ) : null}
          {showMacd ? (
            <MACDChart>
              <DIF />
              <DEA />
              <MACD />
            </MACDChart>
          ) : null}
        </KeisenChart>
      </div>
    </>
  );
}

function DrawControls() {
  const { data } = useKlineData();
  const { addDrawing, clearDrawings } = useDrawOverlay();
  const [active, setActive] = useState<"fib" | "horizontal" | null>(null);

  const addFib = () => {
    const kline = data.kline;
    if (kline.length < 20) return;
    const i0 = Math.floor(kline.length * 0.35);
    const i1 = Math.floor(kline.length * 0.75);
    const a = kline[i0]!;
    const b = kline[i1]!;
    clearDrawings();
    addDrawing({
      tool: "fibRetracement",
      paneId: "main",
      points: [
        { barIndex: i0, value: a.h, time: a.t },
        { barIndex: i1, value: b.l, time: b.t },
      ],
      style: { stroke: "#c45c26", lineWidth: 1.25 },
    });
    setActive("fib");
  };

  const addHorizontal = () => {
    const kline = data.kline;
    if (kline.length < 2) return;
    const last = kline[kline.length - 1]!;
    addDrawing({
      tool: "horizontal",
      paneId: "main",
      points: [{ barIndex: kline.length - 1, value: last.c, time: last.t }],
      style: { stroke: "#1c1b19", lineWidth: 1.5 },
    });
    setActive("horizontal");
  };

  return (
    <div className={styles.actions}>
      <ActionButton active={active === "fib"} onClick={addFib}>
        <Translate id="landing.walkthrough.draw.fib">Fibonacci</Translate>
      </ActionButton>
      <ActionButton
        active={active === "horizontal"}
        onClick={addHorizontal}
      >
        <Translate id="landing.walkthrough.draw.horizontal">
          Horizontal
        </Translate>
      </ActionButton>
      <ActionButton
        onClick={() => {
          clearDrawings();
          setActive(null);
        }}
      >
        <Translate id="landing.walkthrough.draw.clear">Clear</Translate>
      </ActionButton>
    </div>
  );
}

function DrawingsStep() {
  const { locale, mode } = useChartChrome();
  return (
    <div className={styles.drawingsLayout}>
      <KeisenChart
        getData={getKlineData}
        onSubscribe={subscribeKline}
        symbol="BTCUSDT"
        resolution="1"
        mode={mode}
        locale={locale}
        header={<DrawControls />}
      >
        <MainKlineChart>
          <KlineCandles />
        </MainKlineChart>
      </KeisenChart>
    </div>
  );
}

function StepCopy({ stepId }: { stepId: StepId }) {
  switch (stepId) {
    case "static":
      return (
        <>
          <p className={styles.stepLabel}>
            <Translate id="landing.walkthrough.static.label">Data</Translate>
          </p>
          <h3 className={styles.stepTitle}>
            <Translate id="landing.walkthrough.static.title">
              Static series
            </Translate>
          </h3>
          <p className={styles.stepBody}>
            <Translate id="landing.walkthrough.static.body">
              Pass a candlestick array as data and you have a chart. Slice or
              swap the array — the view follows.
            </Translate>
          </p>
        </>
      );
    case "dynamic":
      return (
        <>
          <p className={styles.stepLabel}>
            <Translate id="landing.walkthrough.dynamic.label">Live</Translate>
          </p>
          <h3 className={styles.stepTitle}>
            <Translate id="landing.walkthrough.dynamic.title">
              Dynamic feeds
            </Translate>
          </h3>
          <p className={styles.stepBody}>
            <Translate id="landing.walkthrough.dynamic.body">
              Load history with getData, push ticks with onSubscribe. Switch
              symbol or resolution without rewriting the chart tree.
            </Translate>
          </p>
        </>
      );
    case "theme":
      return (
        <>
          <p className={styles.stepLabel}>
            <Translate id="landing.walkthrough.theme.label">Theme</Translate>
          </p>
          <h3 className={styles.stepTitle}>
            <Translate id="landing.walkthrough.theme.title">
              Theme system
            </Translate>
          </h3>
          <p className={styles.stepBody}>
            <Translate id="landing.walkthrough.theme.body">
              Light and dark modes, built-in palettes, or register your own.
              Tokens flow through every pane.
            </Translate>
          </p>
        </>
      );
    case "indicators":
      return (
        <>
          <p className={styles.stepLabel}>
            <Translate id="landing.walkthrough.indicators.label">
              Indicators
            </Translate>
          </p>
          <h3 className={styles.stepTitle}>
            <Translate id="landing.walkthrough.indicators.title">
              Main &amp; pane layers
            </Translate>
          </h3>
          <p className={styles.stepBody}>
            <Translate id="landing.walkthrough.indicators.body">
              Compose MA on the main pane, volume and MACD below. Toggle
              visibility without tearing down the chart.
            </Translate>
          </p>
        </>
      );
    case "drawings":
      return (
        <>
          <p className={styles.stepLabel}>
            <Translate id="landing.walkthrough.drawings.label">
              Drawings
            </Translate>
          </p>
          <h3 className={styles.stepTitle}>
            <Translate id="landing.walkthrough.drawings.title">
              Drawing tools
            </Translate>
          </h3>
          <p className={styles.stepBody}>
            <Translate id="landing.walkthrough.drawings.body">
              Place Fibonacci retracements and horizontals from code — or let
              users draw on the canvas.
            </Translate>
          </p>
        </>
      );
  }
}

export default function FeatureWalkthrough(): ReactNode {
  const rootRef = useRef<HTMLElement>(null);
  const step = useStickyStep(rootRef);
  const stepId = STEP_IDS[step]!;
  const prevStepRef = useRef(step);
  const copyDirRef = useRef<1 | -1>(1);
  if (prevStepRef.current !== step) {
    copyDirRef.current = step >= prevStepRef.current ? 1 : -1;
    prevStepRef.current = step;
  }
  const copyDir = copyDirRef.current;

  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  const { colorMode, setColorMode } = useColorMode();
  const locale = chartLocaleFromSite(currentLocale);
  const mode: ThemeMode = colorMode === "dark" ? "dark" : "light";
  const setMode = useCallback(
    (next: ThemeMode) => {
      setColorMode(next);
    },
    [setColorMode],
  );
  const chrome = useMemo(
    () => ({ locale, mode, setMode }),
    [locale, mode, setMode],
  );

  const [slice, setSlice] = useState<"full" | "half">("full");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [resolution, setResolution] = useState<Resolution>("1");
  const [themeId, setThemeId] = useState<"default" | "neon">("default");
  const [showMa, setShowMa] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showMacd, setShowMacd] = useState(true);

  useEffect(() => {
    setSlice("full");
    setSymbol("BTCUSDT");
    setResolution("1");
    setThemeId("default");
    setShowMa(true);
    setShowVolume(true);
    setShowMacd(true);
  }, [step]);

  const toggleMa = useCallback(() => setShowMa((v) => !v), []);
  const toggleVolume = useCallback(() => setShowVolume((v) => !v), []);
  const toggleMacd = useCallback(() => setShowMacd((v) => !v), []);

  return (
    <ChartChromeContext.Provider value={chrome}>
      <section
        ref={rootRef}
        className={styles.root}
        aria-label="Feature walkthrough"
        style={{ height: `${STEP_COUNT * 100}vh` }}
      >
        <div className={styles.sticky}>
          <div className={styles.stage}>
            <div className={styles.copy}>
              <p className={styles.sectionLabel}>
                <Translate id="landing.walkthrough.label">
                  Walkthrough
                </Translate>
              </p>
              <p className={styles.progress} aria-live="polite">
                {step + 1} / {STEP_COUNT}
              </p>
              <div
                key={stepId}
                className={`${styles.copyBody} ${
                  copyDir === 1
                    ? styles.copyBodyEnterDown
                    : styles.copyBodyEnterUp
                }`}
              >
                <StepCopy stepId={stepId} />
              </div>
            </div>
            <div className={styles.demo} key={stepId}>
              {stepId === "static" ? (
                <StaticStep slice={slice} onSlice={setSlice} />
              ) : null}
              {stepId === "dynamic" ? (
                <DynamicStep
                  symbol={symbol}
                  resolution={resolution}
                  onSymbol={setSymbol}
                  onResolution={setResolution}
                />
              ) : null}
              {stepId === "theme" ? (
                <ThemeStep themeId={themeId} onTheme={setThemeId} />
              ) : null}
              {stepId === "indicators" ? (
                <IndicatorsStep
                  showMa={showMa}
                  showVolume={showVolume}
                  showMacd={showMacd}
                  onToggleMa={toggleMa}
                  onToggleVolume={toggleVolume}
                  onToggleMacd={toggleMacd}
                />
              ) : null}
              {stepId === "drawings" ? <DrawingsStep /> : null}
            </div>
          </div>
        </div>
      </section>
    </ChartChromeContext.Provider>
  );
}
