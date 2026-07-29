export type IndicatorSetting = {
  visible: boolean;
  colors: Record<string, string>;
  params?: Record<string, number | number[]>;
};

export type IndicatorSettings = Record<string, IndicatorSetting>;

/** number：单值参数；periodList：不定长周期列表（可 append），颜色键为 `${colorKeyPrefix}${period}` */
export type IndicatorParamField =
  | {
      key: string;
      label: string;
      kind: "number";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      key: string;
      label: string;
      kind: "periodList";
      colorKeyPrefix: string;
      minItems?: number;
      maxItems?: number;
    };

export type IndicatorMetaItem = {
  id: string;
  label: string;
  colorLabels: Record<string, string>;
  paramFields?: IndicatorParamField[];
};

export type IndicatorGroupMeta = {
  title: string;
  indicators: IndicatorMetaItem[];
};

export type IndicatorPlacementGroup = "main" | "pane";

export type BuiltinIndicatorMeta = IndicatorMetaItem & {
  group: IndicatorPlacementGroup;
  defaultSetting: IndicatorSetting;
};

export type IndicatorExtraMeta = {
  id: string;
  meta: {
    group: IndicatorPlacementGroup;
    label: string;
    colorLabels: Record<string, string>;
    paramFields?: IndicatorParamField[];
  };
  defaultSetting?: IndicatorSetting;
};

export type IndicatorPanelProps = {
  groups: IndicatorGroupMeta[];
  settings: IndicatorSettings;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (id: string, params: Record<string, number | number[]>) => void;
  reset: () => void;
};

export type MainLayerSpec =
  | {
      kind: "ma";
      periods: number[];
      colors: Record<string, string>;
    }
  | {
      kind: "ema";
      period: number;
      color: string;
    }
  | {
      kind: "smma";
      period: number;
      color: string;
    }
  | {
      kind: "boll";
      period: number;
      stdDev: number;
      colors: {
        upper: string;
        middle: string;
        lower: string;
      };
    }
  | {
      kind: "sar";
      start: number;
      step: number;
      max: number;
      color: string;
    }
  | {
      kind: "extra";
      id: string;
      setting: IndicatorSetting;
    };

export type PaneChartSpec =
  | {
      kind: "volume";
      maPeriods: number[];
      colors: Record<string, string>;
    }
  | {
      kind: "macd";
      fastPeriod: number;
      slowPeriod: number;
      signalPeriod: number;
      colors: {
        dif: string;
        dea: string;
        up: string;
        down: string;
      };
    }
  | {
      kind: "rsi";
      periods: number[];
      colors: Record<string, string>;
    }
  | {
      kind: "kdj";
      period: number;
      kPeriod: number;
      dPeriod: number;
      colors: {
        k: string;
        d: string;
        j: string;
      };
    }
  | {
      kind: "obv";
      maPeriod: number;
      colors: {
        obv: string;
        maobv: string;
      };
    }
  | {
      kind: "cci";
      period: number;
      colors: {
        cci: string;
      };
    }
  | {
      kind: "wr";
      period: number;
      colors: {
        wr: string;
      };
    }
  | {
      kind: "dmi";
      n: number;
      mm: number;
      colors: {
        pdi: string;
        mdi: string;
        adx: string;
        adxr: string;
      };
    }
  | {
      kind: "mtm";
      n: number;
      m: number;
      colors: {
        mtm: string;
        mamtm: string;
      };
    }
  | {
      kind: "extra";
      id: string;
      setting: IndicatorSetting;
    };

export type IndicatorComposePlan = {
  mainLayers: MainLayerSpec[];
  paneCharts: PaneChartSpec[];
};
