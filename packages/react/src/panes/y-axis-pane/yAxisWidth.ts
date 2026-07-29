import { useMemo } from "react";

import {
  computeNiceTicks,
  createPriceFormatter,
  measureYAxisWidth,
  type PriceDomain,
  type PriceFormatter,
} from "@keisen-charts/core";

const Y_AXIS_FONT = "12px sans-serif";
const Y_AXIS_MIN_WIDTH = 48;

const defaultTickFormatter = createPriceFormatter({ type: "price" });

export const measureYAxisPaneWidth = (
  priceDomain: PriceDomain,
  viewportHeight: number,
  formatLabel: PriceFormatter = defaultTickFormatter,
  minMove?: number,
): number => {
  if (viewportHeight <= 0) return Y_AXIS_MIN_WIDTH;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return Y_AXIS_MIN_WIDTH;

  const ticks = computeNiceTicks(priceDomain, viewportHeight, {
    formatLabel,
    minMove,
  });
  return Math.max(
    Y_AXIS_MIN_WIDTH,
    measureYAxisWidth(ctx, ticks, 16, Y_AXIS_FONT),
  );
};

export const useYAxisPaneWidth = (
  priceDomain: PriceDomain,
  viewportHeight: number,
  formatLabel: PriceFormatter = defaultTickFormatter,
  minMove?: number,
): number =>
  useMemo(
    () =>
      measureYAxisPaneWidth(priceDomain, viewportHeight, formatLabel, minMove),
    [priceDomain.min, priceDomain.max, viewportHeight, formatLabel, minMove],
  );
