import type { IndicatorDescriptor } from "./types";

const registry = new Map<string, IndicatorDescriptor>();

export const registerIndicator = (descriptor: IndicatorDescriptor): void => {
  if (descriptor.placement === "overlay") {
    throw new Error(
      `[keisen] registerIndicator: placement "overlay" is not supported yet (name=${descriptor.name})`,
    );
  }
  registry.set(descriptor.name, descriptor);
};

export const getIndicator = (name: string): IndicatorDescriptor | undefined =>
  registry.get(name);

export const listIndicators = (): IndicatorDescriptor[] =>
  Array.from(registry.values());

export const hasIndicator = (name: string): boolean => registry.has(name);

/** 测试用：清空注册表 */
export const clearIndicatorRegistry = (): void => {
  registry.clear();
};
