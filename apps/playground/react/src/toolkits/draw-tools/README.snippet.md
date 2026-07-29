# Draw tools toolkit

```tsx
import { useState } from "react";
import { KeisenChart, MainKlineChart, KlineCandles } from "@keisen-charts/react";
import { DrawToolsToolbar, useDrawOverlay } from "./toolkits/draw-tools";

function ChartHeader({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const draw = useDrawOverlay();
  return (
    <>
      <button
        type="button"
        className={open ? "active" : undefined}
        aria-pressed={open}
        onClick={() => {
          if (open) draw.setOverlay(null);
          onOpenChange(!open);
        }}
      >
        画线
      </button>
      {open ? (
        <aside className="draw-tools-rail">
          <DrawToolsToolbar {...draw.toolbarProps} />
        </aside>
      ) : null}
    </>
  );
}

export function App() {
  const [drawToolsOpen, setDrawToolsOpen] = useState(true);
  return (
    <div className={drawToolsOpen ? "chart-container draw-tools-open" : "chart-container"}>
      <KeisenChart
        header={
          <ChartHeader open={drawToolsOpen} onOpenChange={setDrawToolsOpen} />
        }
      >
        <MainKlineChart renderer="canvas">
          <KlineCandles />
        </MainKlineChart>
      </KeisenChart>
    </div>
  );
}
```

Notes:

- `useDrawOverlay` must run inside `KeisenChart` (store provider).
- Put the toolbar in a left rail beside the chart (not `position` overlay on candles). Toggle with a header button; host layout should reserve width (e.g. `.draw-tools-open { padding-left: … }`).
- `setOverlay("ray")` enters place mode; click on any pane to drop points.
- `addDrawing({...})` creates shapes programmatically.
- Esc cancels tool / clears selection; Delete removes selected.
