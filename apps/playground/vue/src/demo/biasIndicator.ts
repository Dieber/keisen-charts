import {
  createVueLayerComponent,
  registerIndicator,
} from "@keisen-charts/vue";
import { h, type VNodeChild } from "vue";
import type { IndicatorSetting } from "@keisen-charts/vue/toolkit";

export const BiasChart = registerIndicator({
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

export const BiasLine = createVueLayerComponent("Bias:bias", {
  color: String,
});

/** toolkit compose 入口仍返回 VNode；这里保留 h() 工厂即可 */
export const createBiasChart = (setting: IndicatorSetting): VNodeChild => {
  const period =
    typeof setting.params?.period === "number" ? setting.params.period : 6;
  return h(
    BiasChart,
    { key: "bias", renderer: "canvas", period },
    () => [h(BiasLine, { color: setting.colors.bias })],
  );
};
