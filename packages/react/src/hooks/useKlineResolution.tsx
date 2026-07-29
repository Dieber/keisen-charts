import { setDataMeta, type Resolution } from "@keisen-charts/core";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useKlineStore } from "../context/KeisenStoreContext";

type ResolutionContextValue = {
  /** 根组件 resolution prop（首屏 meta 未写入前供 hook 回退，避免闪默认 1m） */
  resolutionProp: Resolution;
  onResolutionChange?: (resolution: Resolution) => void;
};

const ResolutionContext = createContext<ResolutionContextValue>({
  resolutionProp: "1",
});

export const ResolutionCallbacksProvider = ({
  children,
  resolution,
  onResolutionChange,
}: {
  children: ReactNode;
  resolution: Resolution;
  onResolutionChange?: (resolution: Resolution) => void;
}) => (
  <ResolutionContext.Provider
    value={{ resolutionProp: resolution, onResolutionChange }}
  >
    {children}
  </ResolutionContext.Provider>
);

export const useKlineResolution = () => {
  const store = useKlineStore();
  const { resolutionProp, onResolutionChange } = useContext(ResolutionContext);

  const resolution = useSyncExternalStore(
    (onStoreChange) =>
      store.subscribeSlice(
        (state) => state.data.meta?.resolution,
        onStoreChange,
      ),
    () => store.getState().data.meta?.resolution,
    () => store.getState().data.meta?.resolution,
  );

  const setResolution = useCallback(
    (nextResolution: Resolution) => {
      setDataMeta(store, { resolution: nextResolution });
      onResolutionChange?.(nextResolution);
    },
    [store, onResolutionChange],
  );

  return {
    resolution: resolution ?? resolutionProp,
    setResolution,
  };
};
