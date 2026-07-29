/** Vue Sandpack sources for indicator settings popup (visibility + colors). */

export const VUE_INDICATOR_PANEL = `<script setup lang="ts">
import { computed } from "vue";
import {
  appendPeriodList,
  partitionIndicatorParamFields,
  patchParams,
  readPeriods,
  removePeriodListAt,
  toColorInputValue,
  updatePeriodListAt,
} from "@keisen-charts/vue/toolkit";

/**
 * defineProps 泛型必须是本文件字面量类型；
 * Sandpack 解析到的包入口不含可用类型，不能 import type 进 defineProps。
 */
type PeriodListField = {
  key: string;
  label: string;
  kind: "periodList";
  colorKeyPrefix: string;
  minItems?: number;
  maxItems?: number;
};

type IndicatorItem = {
  id: string;
  label: string;
  colorLabels: Record<string, string>;
  paramFields?: Array<
    | PeriodListField
    | {
        key: string;
        label: string;
        kind: "number";
        min?: number;
        max?: number;
        step?: number;
      }
  >;
};

type IndicatorSetting = {
  visible: boolean;
  colors: Record<string, string>;
  params?: Record<string, number | number[]>;
};

const props = defineProps<{
  groups: Array<{ title: string; indicators: IndicatorItem[] }>;
  settings: Record<string, IndicatorSetting>;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (id: string, params: Record<string, number | number[]>) => void;
  reset: () => void;
  onConfirm?: () => void;
}>();

const sections = computed(() =>
  props.groups.map((group) => ({
    title: group.title,
    rows: group.indicators.flatMap((indicator) => {
      const setting = props.settings[indicator.id];
      if (!setting) return [];
      const { periodListField, staticColorEntries } =
        partitionIndicatorParamFields(indicator);
      const periods = periodListField
        ? readPeriods(setting, periodListField.key)
        : [];
      return [
        {
          indicator,
          setting,
          periodListField,
          staticColorEntries,
          periods,
        },
      ];
    }),
  })),
);

const commitPeriods = (
  indicatorId: string,
  setting: IndicatorSetting,
  field: PeriodListField,
  nextPeriods: number[],
  nextColors?: Record<string, string>,
) => {
  props.setParams(
    indicatorId,
    patchParams(setting, { [field.key]: nextPeriods }),
  );
  if (!nextColors) return;
  for (const [key, color] of Object.entries(nextColors)) {
    if (setting.colors[key] !== color) props.setColor(indicatorId, key, color);
  }
};

const onPeriodChange = (
  indicatorId: string,
  setting: IndicatorSetting,
  field: PeriodListField,
  periods: number[],
  index: number,
  event: Event,
) => {
  const raw = (event.target as HTMLInputElement).value;
  const result = updatePeriodListAt(periods, setting, field, index, raw);
  if (result) {
    commitPeriods(
      indicatorId,
      setting,
      field,
      result.nextPeriods,
      result.nextColors,
    );
  }
};

const onRemovePeriod = (
  indicatorId: string,
  setting: IndicatorSetting,
  field: PeriodListField,
  periods: number[],
  index: number,
) => {
  const next = removePeriodListAt(periods, index, field.minItems ?? 1);
  if (next) commitPeriods(indicatorId, setting, field, next);
};

const onAppendPeriod = (
  indicatorId: string,
  setting: IndicatorSetting,
  field: PeriodListField,
  periods: number[],
) => {
  const result = appendPeriodList(
    periods,
    setting,
    field,
    field.maxItems ?? 12,
  );
  if (result) {
    commitPeriods(
      indicatorId,
      setting,
      field,
      result.nextPeriods,
      result.nextColors,
    );
  }
};

const onColor = (id: string, key: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  props.setColor(id, key, input.value.toLowerCase());
};

const onToggle = (id: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  props.setVisible(id, input.checked);
};
</script>

<template>
  <div class="keisen-toolkit-indicator" aria-label="指标设置">
    <div class="keisen-toolkit-indicator__header">
      <strong>指标设置</strong>
    </div>
    <div class="keisen-toolkit-indicator__body">
      <section
        v-for="section in sections"
        :key="section.title"
        class="keisen-toolkit-indicator__section"
      >
        <h3>{{ section.title }}</h3>
        <div
          v-for="row in section.rows"
          :key="row.indicator.id"
          class="keisen-toolkit-indicator__row"
        >
          <label class="keisen-toolkit-indicator__toggle">
            <input
              type="checkbox"
              :checked="row.setting.visible"
              @change="onToggle(row.indicator.id, $event)"
            />
            <span>{{ row.indicator.label }}</span>
          </label>
          <div class="keisen-toolkit-indicator__controls">
            <div v-if="row.periodListField">
              <div class="keisen-toolkit-indicator__param-title">
                {{ row.periodListField.label }}
              </div>
              <div class="keisen-toolkit-indicator__period-list">
                <div
                  v-for="(period, index) in row.periods"
                  :key="row.periodListField.colorKeyPrefix + period + '-' + index"
                  class="keisen-toolkit-indicator__period-row"
                >
                  <input
                    type="number"
                    class="keisen-toolkit-indicator__number"
                    min="1"
                    step="1"
                    :value="period"
                    :disabled="!row.setting.visible"
                    @change="
                      onPeriodChange(
                        row.indicator.id,
                        row.setting,
                        row.periodListField,
                        row.periods,
                        index,
                        $event,
                      )
                    "
                  />
                  <input
                    type="color"
                    :value="
                      toColorInputValue(
                        row.setting.colors[
                          row.periodListField.colorKeyPrefix + period
                        ] ?? '#888888',
                      )
                    "
                    :disabled="!row.setting.visible"
                    @input="
                      onColor(
                        row.indicator.id,
                        row.periodListField.colorKeyPrefix + period,
                        $event,
                      )
                    "
                  />
                  <button
                    type="button"
                    class="keisen-toolkit-indicator__icon-btn"
                    :disabled="
                      !row.setting.visible ||
                      row.periods.length <= (row.periodListField.minItems ?? 1)
                    "
                    @click="
                      onRemovePeriod(
                        row.indicator.id,
                        row.setting,
                        row.periodListField,
                        row.periods,
                        index,
                      )
                    "
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  class="keisen-toolkit-indicator__add-btn"
                  :disabled="
                    !row.setting.visible ||
                    row.periods.length >= (row.periodListField.maxItems ?? 12)
                  "
                  @click="
                    onAppendPeriod(
                      row.indicator.id,
                      row.setting,
                      row.periodListField,
                      row.periods,
                    )
                  "
                >
                  + 添加{{ row.periodListField.label }}
                </button>
              </div>
            </div>
            <div
              v-if="row.staticColorEntries.length"
              class="keisen-toolkit-indicator__colors"
            >
              <label
                v-for="[colorKey, label] in row.staticColorEntries"
                :key="colorKey"
                class="keisen-toolkit-indicator__color"
              >
                <span>{{ label }}</span>
                <input
                  type="color"
                  :value="
                    toColorInputValue(row.setting.colors[colorKey] ?? '#888888')
                  "
                  :disabled="!row.setting.visible"
                  @input="onColor(row.indicator.id, colorKey, $event)"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div class="keisen-toolkit-indicator__footer">
      <button
        type="button"
        class="keisen-toolkit-indicator__btn"
        @click="reset"
      >
        重置
      </button>
      <button
        type="button"
        class="keisen-toolkit-indicator__btn keisen-toolkit-indicator__btn--primary"
        @click="onConfirm?.()"
      >
        确定
      </button>
    </div>
  </div>
</template>
`;

export const VUE_INDICATOR_TOOLBAR = `<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import IndicatorSettingsPanel from "./IndicatorSettingsPanel.vue";

/** 与 panelProps 对齐的本地字面量类型（勿从包入口 import type） */
type PanelProps = {
  groups: unknown[];
  settings: Record<string, unknown>;
  setVisible: (id: string, visible: boolean) => void;
  setColor: (id: string, key: string, color: string) => void;
  setParams: (id: string, params: Record<string, number | number[]>) => void;
  reset: () => void;
};

const props = defineProps<{ panelProps: PanelProps }>();
const open = ref(false);
const hostRef = ref<HTMLElement | null>(null);

let detach: (() => void) | undefined;

const bindDismiss = () => {
  detach?.();
  if (!open.value) return;
  const onPointerDown = (event: PointerEvent) => {
    if (!hostRef.value?.contains(event.target as Node)) open.value = false;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") open.value = false;
  };
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
  detach = () => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
  };
};

watch(open, bindDismiss);
onMounted(bindDismiss);
onBeforeUnmount(() => detach?.());
</script>

<template>
  <div ref="hostRef" class="indicator-host">
    <button type="button" :aria-expanded="open" @click="open = !open">
      指标设置
    </button>
    <div v-if="open" class="indicator-shell">
      <IndicatorSettingsPanel
        v-bind="panelProps"
        :on-confirm="() => (open = false)"
      />
    </div>
  </div>
</template>
`;
