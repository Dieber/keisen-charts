import { registerBuiltinOverlayLayers } from "@keisen-charts/core";
import { ensureBuiltinIndicatorCharts } from "../indicators/registerBuiltinIndicators";


let registered = false;

export const registerLayers = (): void => {
  if (registered) return;
  registered = true;

  ensureBuiltinIndicatorCharts();
  registerBuiltinOverlayLayers();
};
