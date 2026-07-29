import type { ReactNode } from "react";

import type { IndicatorCalcParams } from "@keisen-charts/core";

import { IndicatorView } from "./view/IndicatorView";

export type IndicatorPaneProps = {
  paneId: string;
  indicatorName: string;
  calcParams: IndicatorCalcParams;
  layerChildren: ReactNode;
};

export const IndicatorPane = ({
  paneId,
  indicatorName,
  calcParams,
  layerChildren,
}: IndicatorPaneProps) => (
  <IndicatorView
    paneId={paneId}
    indicatorName={indicatorName}
    calcParams={calcParams}
    layerChildren={layerChildren}
  />
);
