# Keisen

🚧 A modern web candlestick chart component library — work in progress 🚧.

**Keisen** takes its name from the Japanese **罫線** (けいせん) — the historical term for candlestick charts in Japanese finance. We chose it to bring professional charting to the modern web with the component APIs you already know.

## Features

- 👀 **What you write is what you get** — declare chart structure with JSX / templates; child components are layers
- 🖼️ **Cross-framework** — one API for [React](https://github.com/Dieber/keisen-charts/tree/main/packages/react) and [Vue](https://github.com/Dieber/keisen-charts/tree/main/packages/vue)
- 🎁 **Ready out of the box** — pass in candle data and render; compose themes, intervals, indicators, drawing tools as needed
- 🎈 **Very lightweight** — zero dependencies, ~20kb gzipped
- 🧩 **Component-first** — if you know React / Vue, you know Keisen; minimal chart-library learning curve

```tsx
import { KeisenChart } from "@keisen-charts/react";

export default function App() {
  return (
    <div style={{ width: "100%", height: 420 }}>
      <KeisenChart data={data} mode="light" />
    </div>
  );
}
```

## Docs & Links

| | |
| --- | --- |
| Docs | [https://keisen-charts-website.vercel.app](https://keisen-charts-website.vercel.app) |
| GitHub | [https://github.com/Dieber/keisen-charts](https://github.com/Dieber/keisen-charts) |
| Quick start | [https://keisen-charts-website.vercel.app/docs/quick-start](https://keisen-charts-website.vercel.app/docs/quick-start) |
| npm (React) | [`@keisen-charts/react`](https://www.npmjs.com/package/@keisen-charts/react) |
| npm (Vue) | [`@keisen-charts/vue`](https://www.npmjs.com/package/@keisen-charts/vue) |

## Install

```bash
bun add @keisen-charts/react
# or
bun add @keisen-charts/vue
```

`npm` / `pnpm` / `yarn` work too. Peer dependencies are `react@^18 || ^19` or `vue@^3.5`.

## Development

### TODOS

- [ ] Vanilla JS support
- [ ] Overlay support
- [ ] IANA support
- [ ] More indicators
- [ ] Improve docs

## License

MIT
