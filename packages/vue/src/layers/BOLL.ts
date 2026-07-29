import { createVueLayerComponent } from "../renderer/createVueLayerComponent";

export type BOLLProps = {
  period?: number;
  stdDev?: number;
  upperColor?: string;
  middleColor?: string;
  lowerColor?: string;
};

export const BOLL = createVueLayerComponent("BOLL", {
  period: Number,
  stdDev: Number,
  upperColor: String,
  middleColor: String,
  lowerColor: String,
});
