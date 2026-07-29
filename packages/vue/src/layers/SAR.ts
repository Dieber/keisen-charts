import { createVueLayerComponent } from "../renderer/createVueLayerComponent";

export type SARProps = {
  start?: number;
  step?: number;
  max?: number;
  color?: string;
};

export const SAR = createVueLayerComponent("SAR", {
  start: Number,
  step: Number,
  max: Number,
  color: String,
});
