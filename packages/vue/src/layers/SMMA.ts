import { createVueLayerComponent } from "../renderer/createVueLayerComponent";

export type SMMAProps = {
  period: number;
  color?: string;
};

export const SMMA = createVueLayerComponent("SMMA", {
  period: { type: Number, required: true },
  color: String,
});
