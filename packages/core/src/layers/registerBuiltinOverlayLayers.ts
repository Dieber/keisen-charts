import { DrawingsLayer } from "../drawings/DrawingsLayer";
import type { ChartDataState } from "../types/kline";
import type { KeisenState, Store } from "../store/Store";
import { BOLLLayer } from "../renderer/views/kline/layers/BOLLLayer";
import { EMALayer } from "../renderer/views/kline/layers/EMALayer";
import { KlineLayer } from "../renderer/views/kline/layers/KlineLayer";
import { MALayer } from "../renderer/views/kline/layers/MALayer";
import { SARLayer } from "../renderer/views/kline/layers/SARLayer";
import { SMMALayer } from "../renderer/views/kline/layers/SMMALayer";
import { registerLayerType } from "./layerRegistry";

let registered = false;

const requirePositive = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`[keisen] ${label} must be a positive number`);
  }
  return value;
};

const optionalColor = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const registerBuiltinOverlayLayers = (): void => {
  if (registered) return;
  registered = true;

  registerLayerType("KlineCandles", {
    createCoreLayer: () => new KlineLayer(),
  });

  registerLayerType("MA", {
    createCoreLayer: (props) => {
      const period = requirePositive(Number(props.period), "MA period");
      return new MALayer(period, optionalColor(props.color));
    },
  });

  registerLayerType("EMA", {
    createCoreLayer: (props) => {
      const period = requirePositive(Number(props.period), "EMA period");
      return new EMALayer(period, optionalColor(props.color));
    },
  });

  registerLayerType("SMMA", {
    createCoreLayer: (props) => {
      const period = requirePositive(Number(props.period), "SMMA period");
      return new SMMALayer(period, optionalColor(props.color));
    },
  });

  registerLayerType("BOLL", {
    createCoreLayer: (props) => {
      const period = requirePositive(
        Number(props.period ?? 20),
        "BOLL period",
      );
      const stdDev = requirePositive(
        Number(props.stdDev ?? 2),
        "BOLL stdDev",
      );
      return new BOLLLayer(period, stdDev, {
        upperColor: optionalColor(props.upperColor),
        middleColor: optionalColor(props.middleColor),
        lowerColor: optionalColor(props.lowerColor),
      });
    },
  });

  registerLayerType("SAR", {
    createCoreLayer: (props) => {
      const start = requirePositive(Number(props.start ?? 2), "SAR start");
      const step = requirePositive(Number(props.step ?? 2), "SAR step");
      const max = requirePositive(Number(props.max ?? 20), "SAR max");
      if (start > max) {
        throw new Error("[keisen] SAR start must be <= max");
      }
      return new SARLayer(start, step, max, optionalColor(props.color));
    },
  });

  registerLayerType("Drawings", {
    createCoreLayer: (props) => {
      const paneId =
        typeof props.paneId === "string" && props.paneId.length > 0
          ? props.paneId
          : "main";
      const store = props.store as
        | Store<KeisenState<ChartDataState>>
        | undefined;
      if (!store) {
        throw new Error("[keisen] Drawings layer requires store prop");
      }
      return new DrawingsLayer(paneId, store);
    },
  });
};
