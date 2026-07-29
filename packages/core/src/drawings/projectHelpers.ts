import { indexToX, xToIndex } from "../math/viewport";
import { priceToY, yToPrice } from "../math/priceViewport";
import type { IndexDomain, PriceDomain } from "../store/Store";
import type { DrawingProjectHelpers } from "./types";

export type BuildDrawingHelpersInput = {
  indexDomain: IndexDomain;
  valueDomain: PriceDomain;
  viewportWidth: number;
  viewportHeight: number;
  formatValue?: (value: number) => string;
};

export const buildDrawingHelpers = (
  input: BuildDrawingHelpersInput,
): DrawingProjectHelpers => {
  const {
    indexDomain,
    valueDomain,
    viewportWidth,
    viewportHeight,
    formatValue,
  } = input;

  return {
    width: viewportWidth,
    height: viewportHeight,
    formatValue,
    xOfBar: (barIndex) => indexToX(barIndex, indexDomain, viewportWidth),
    yOfValue: (value) => priceToY(value, valueDomain, viewportHeight),
    barOfX: (x) => xToIndex(x, indexDomain, viewportWidth),
    valueOfY: (y) => yToPrice(y, valueDomain, viewportHeight),
  };
};
