# Indicator toolkit scaffold

Copied by `@keisen-charts/create-toolkit`. Edit freely — this is source in your repo.

## What you got

- `IndicatorSettingsPanel` — content panel（显隐 / 图表参数 / 颜色含 `#hex` / 不定长周期可追加；头尾固定，中间滚动）
- `indicator-toolkit.css` — skin via CSS variables（默认宽 520px、高 540px）
- re-exports of `useKlineIndicator` from `@keisen-charts/react/toolkit`

## What you own

Opening UI is **not** included. Put the panel in any container:

```tsx
import { useKlineIndicator, IndicatorSettingsPanel } from "./toolkits/indicator";

const indicator = useKlineIndicator();

// CSS absolute host, Radix Dialog, Vaul drawer — your choice
{open && (
  <aside>
    <IndicatorSettingsPanel {...indicator.panelProps} />
  </aside>
)}
```

## Chart wiring

```tsx
<KeisenChart getData={getData} onSubscribe={onSubscribe}>
  <MainKlineChart>
    <KlineCandles />
    {indicator.mainLayers}
  </MainKlineChart>
  {indicator.paneCharts}
</KeisenChart>
```
