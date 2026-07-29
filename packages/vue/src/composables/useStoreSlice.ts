import { onScopeDispose, readonly, shallowRef, type DeepReadonly, type Ref, type ShallowRef } from "vue";

import type { KeisenStore } from "../context/keys";

/**
 * Subscribe to a store slice and expose it as a readonly shallowRef.
 */
export const useStoreSlice = <T>(
  store: KeisenStore,
  selector: (state: ReturnType<KeisenStore["getState"]>) => T,
): DeepReadonly<Ref<T>> => {
  const value = shallowRef(selector(store.getState())) as ShallowRef<T>;
  const unsubscribe = store.subscribeSlice(selector, () => {
    value.value = selector(store.getState());
  });
  onScopeDispose(unsubscribe);
  return readonly(value);
};
