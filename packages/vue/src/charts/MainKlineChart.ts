import { defineComponent, h } from "vue";

import { registerLayers } from "../layers/registerLayers";
import { KlineCandles } from "../layers/KlineCandles";
import KlineView from "../panes/main-kline-pane/view/KlineView";

registerLayers();

export const MainKlineChart = defineComponent({
  name: "MainKlineChart",
  setup(_props, { slots }) {
    return () =>
      h(
        KlineView,
        null,
        {
          default: () => {
            const children = slots.default?.();
            return children && children.length > 0
              ? children
              : [h(KlineCandles)];
          },
        },
      );
  },
});

(MainKlineChart as typeof MainKlineChart & { displayName: string }).displayName =
  "MainKlineChart";
