import { setDataMeta, type Resolution } from "@keisen-charts/core";
import { computed, inject, type ComputedRef } from "vue";

import { resolutionCallbacksKey } from "../context/keys";
import { useKlineStore } from "../context/useKlineStore";
import { useStoreSlice } from "./useStoreSlice";

export const useKlineResolution = () => {
  const store = useKlineStore();
  const callbacks = inject(resolutionCallbacksKey, {});
  const resolutionSlice = useStoreSlice(
    store,
    (state) => state.data.meta?.resolution,
  );

  const resolution = computed(
    () =>
      resolutionSlice.value ??
      callbacks.resolutionProp ??
      ("1" as Resolution),
  ) as ComputedRef<Resolution>;

  const setResolution = (nextResolution: Resolution) => {
    setDataMeta(store, { resolution: nextResolution });
    callbacks.onResolutionChange?.(nextResolution);
  };

  return {
    resolution,
    setResolution,
  };
};
