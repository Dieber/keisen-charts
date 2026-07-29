import { createVueLayerComponent } from "../renderer/createVueLayerComponent";

export type MAProps = {
  period: number;
  color?: string;
};

export const MA = createVueLayerComponent("MA", {
  period: { type: Number, required: true },
  color: String,
});
