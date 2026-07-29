import {
  ChartDataController,
  type ChartDataState,
  type GetDataFn,
  type KlineBar,
  type KeisenState,
  type OnSubscribeFn,
  type Resolution,
  type Store,
} from "@keisen-charts/core";
import { useEffect, useRef } from "react";

type DataControllerProps = {
  store: Store<KeisenState<ChartDataState>>;
  data?: KlineBar[];
  getData?: GetDataFn;
  onSubscribe?: OnSubscribeFn;
  resolution?: Resolution;
  symbol?: string;
};

export const DataController = ({
  store,
  data,
  getData,
  onSubscribe,
  resolution = "1",
  symbol,
}: DataControllerProps) => {
  const controllerRef = useRef<ChartDataController | null>(null);
  const storeRef = useRef(store);

  useEffect(() => {
    if (!controllerRef.current || storeRef.current !== store) {
      controllerRef.current?.dispose();
      storeRef.current = store;
      controllerRef.current = new ChartDataController(store, {
        data,
        getData,
        onSubscribe,
        resolution,
        symbol,
      });
      return;
    }

    controllerRef.current.setOptions({
      data,
      getData,
      onSubscribe,
      resolution,
      symbol,
    });
  }, [store, data, getData, onSubscribe, resolution, symbol]);

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return null;
};
