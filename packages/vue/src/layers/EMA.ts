import { createVueLayerComponent } from "../renderer/createVueLayerComponent";

export type EMAProps = {
  period: number;
  color?: string;
};

export const EMA = createVueLayerComponent("EMA", {
  period: { type: Number, required: true },
  color: String,
});
