export const indicatorBuiltinSnippet = {
  react: `import {
  KeisenChart,
  MainKlineChart,
  KlineCandles,
  RSIChart,
  RSI,
} from "@keisen-charts/react";

<KeisenChart data={bars}>
  <MainKlineChart>
    <KlineCandles />
  </MainKlineChart>
  <RSIChart>
    <RSI period={14} />
  </RSIChart>
</KeisenChart>
`,
  vue: `<KeisenChart :data="bars">
  <MainKlineChart>
    <KlineCandles />
  </MainKlineChart>
  <RSIChart>
    <RSI :period="14" />
  </RSIChart>
</KeisenChart>
`,
};
