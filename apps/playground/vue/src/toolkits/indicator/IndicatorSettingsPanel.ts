import type {
  IndicatorPanelProps,
  IndicatorParamField,
  IndicatorSetting,
} from "@keisen-charts/vue/toolkit";
import {
  appendPeriodList,
  normalizeHex,
  partitionIndicatorParamFields,
  patchParams,
  readNumberParam,
  readPeriods,
  removePeriodListAt,
  toColorInputValue,
  updatePeriodListAt,
} from "@keisen-charts/vue/toolkit";
import {
  computed,
  defineComponent,
  h,
  ref,
  watch,
  type PropType,
} from "vue";

import "./indicator-toolkit.css";

export type IndicatorSettingsPanelProps = IndicatorPanelProps & {
  className?: string;
  title?: string;
  onConfirm?: () => void;
};

const HexColorInput = defineComponent({
  name: "HexColorInput",
  props: {
    value: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, required: true },
    onCommit: {
      type: Function as PropType<(color: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const committed = computed(() => toColorInputValue(props.value));
    const text = ref(committed.value);

    watch(committed, (next) => {
      text.value = next;
    });

    const commitText = () => {
      const next = normalizeHex(text.value);
      if (!next) {
        text.value = committed.value;
        return;
      }
      text.value = next;
      if (next !== committed.value) props.onCommit(next);
    };

    return () =>
      h("span", { class: "keisen-toolkit-indicator__color-controls" }, [
        h("input", {
          type: "color",
          value: committed.value,
          disabled: props.disabled,
          "aria-label": props.ariaLabel,
          onInput: (event: Event) =>
            props.onCommit(
              (event.target as HTMLInputElement).value.toLowerCase(),
            ),
        }),
        h("input", {
          type: "text",
          class: "keisen-toolkit-indicator__hex",
          value: text.value,
          disabled: props.disabled,
          spellcheck: false,
          maxlength: 7,
          "aria-label": `${props.ariaLabel} 十六进制`,
          placeholder: "#000000",
          onInput: (event: Event) => {
            text.value = (event.target as HTMLInputElement).value;
          },
          onBlur: commitText,
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText();
              (event.target as HTMLInputElement).blur();
            }
          },
        }),
      ]);
  },
});

const PeriodListEditor = defineComponent({
  name: "PeriodListEditor",
  props: {
    field: {
      type: Object as PropType<
        Extract<IndicatorParamField, { kind: "periodList" }>
      >,
      required: true,
    },
    indicatorId: { type: String, required: true },
    indicatorLabel: { type: String, required: true },
    setting: {
      type: Object as PropType<IndicatorSetting>,
      required: true,
    },
    setColor: {
      type: Function as PropType<IndicatorPanelProps["setColor"]>,
      required: true,
    },
    setParams: {
      type: Function as PropType<IndicatorPanelProps["setParams"]>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const periods = readPeriods(props.setting, props.field.key);
      const minItems = props.field.minItems ?? 1;
      const maxItems = props.field.maxItems ?? 12;
      const disabled = !props.setting.visible;

      const commitPeriods = (
        nextPeriods: number[],
        nextColors?: Record<string, string>,
      ) => {
        props.setParams(
          props.indicatorId,
          patchParams(props.setting, { [props.field.key]: nextPeriods }),
        );
        if (!nextColors) return;
        for (const [key, color] of Object.entries(nextColors)) {
          if (props.setting.colors[key] !== color) {
            props.setColor(props.indicatorId, key, color);
          }
        }
      };

      const updatePeriodAt = (index: number, raw: string) => {
        const result = updatePeriodListAt(
          periods,
          props.setting,
          props.field,
          index,
          raw,
        );
        if (!result) return;
        commitPeriods(result.nextPeriods, result.nextColors);
      };

      const removeAt = (index: number) => {
        const next = removePeriodListAt(periods, index, minItems);
        if (!next) return;
        commitPeriods(next);
      };

      const append = () => {
        const result = appendPeriodList(
          periods,
          props.setting,
          props.field,
          maxItems,
        );
        if (!result) return;
        commitPeriods(result.nextPeriods, result.nextColors);
      };

      return h("div", { class: "keisen-toolkit-indicator__param-block" }, [
        h("div", { class: "keisen-toolkit-indicator__param-title" }, props.field.label),
        h("div", { class: "keisen-toolkit-indicator__period-list" }, [
          ...periods.map((period, index) => {
            const colorKey = `${props.field.colorKeyPrefix}${period}`;
            const label = `${props.indicatorLabel}${period}`;
            return h(
              "div",
              {
                class: "keisen-toolkit-indicator__period-row",
                key: `${colorKey}-${index}`,
              },
              [
                h("input", {
                  type: "number",
                  class: "keisen-toolkit-indicator__number",
                  min: 1,
                  step: 1,
                  value: period,
                  disabled,
                  "aria-label": `${label} 周期`,
                  onInput: (event: Event) =>
                    updatePeriodAt(
                      index,
                      (event.target as HTMLInputElement).value,
                    ),
                }),
                h(HexColorInput, {
                  value: props.setting.colors[colorKey] ?? "#888888",
                  disabled,
                  ariaLabel: `${label} 颜色`,
                  onCommit: (color: string) =>
                    props.setColor(props.indicatorId, colorKey, color),
                }),
                h(
                  "button",
                  {
                    type: "button",
                    class: "keisen-toolkit-indicator__icon-btn",
                    disabled: disabled || periods.length <= minItems,
                    "aria-label": `移除 ${label}`,
                    onClick: () => removeAt(index),
                  },
                  "×",
                ),
              ],
            );
          }),
          h(
            "button",
            {
              type: "button",
              class: "keisen-toolkit-indicator__add-btn",
              disabled: disabled || periods.length >= maxItems,
              onClick: append,
            },
            `+ 添加${props.field.label}`,
          ),
        ]),
      ]);
    };
  },
});

const NumberParamsEditor = defineComponent({
  name: "NumberParamsEditor",
  props: {
    fields: {
      type: Array as PropType<
        Extract<IndicatorParamField, { kind: "number" }>[]
      >,
      required: true,
    },
    indicatorId: { type: String, required: true },
    setting: {
      type: Object as PropType<IndicatorSetting>,
      required: true,
    },
    setParams: {
      type: Function as PropType<IndicatorPanelProps["setParams"]>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (props.fields.length === 0) return null;
      const disabled = !props.setting.visible;

      return h("div", { class: "keisen-toolkit-indicator__param-block" }, [
        h("div", { class: "keisen-toolkit-indicator__param-title" }, "图表设置"),
        h(
          "div",
          { class: "keisen-toolkit-indicator__number-grid" },
          props.fields.map((field) =>
            h("label", { class: "keisen-toolkit-indicator__number-field", key: field.key }, [
              h("span", field.label),
              h("input", {
                type: "number",
                class: "keisen-toolkit-indicator__number",
                min: field.min,
                max: field.max,
                step: field.step ?? 1,
                value: readNumberParam(props.setting, field.key),
                disabled,
                "aria-label": field.label,
                onInput: (event: Event) => {
                  const parsed = Number(
                    (event.target as HTMLInputElement).value,
                  );
                  if (!Number.isFinite(parsed)) return;
                  const min = field.min ?? Number.NEGATIVE_INFINITY;
                  if (parsed < min) return;
                  props.setParams(
                    props.indicatorId,
                    patchParams(props.setting, { [field.key]: parsed }),
                  );
                },
              }),
            ]),
          ),
        ),
      ]);
    };
  },
});

export const IndicatorSettingsPanel = defineComponent({
  name: "IndicatorSettingsPanel",
  props: {
    groups: {
      type: Array as PropType<IndicatorPanelProps["groups"]>,
      required: true,
    },
    settings: {
      type: Object as PropType<IndicatorPanelProps["settings"]>,
      required: true,
    },
    setVisible: {
      type: Function as PropType<IndicatorPanelProps["setVisible"]>,
      required: true,
    },
    setColor: {
      type: Function as PropType<IndicatorPanelProps["setColor"]>,
      required: true,
    },
    setParams: {
      type: Function as PropType<IndicatorPanelProps["setParams"]>,
      required: true,
    },
    reset: {
      type: Function as PropType<IndicatorPanelProps["reset"]>,
      required: true,
    },
    className: { type: String, default: undefined },
    title: { type: String, default: "指标设置" },
    onConfirm: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      const rootClass = props.className
        ? `keisen-toolkit-indicator ${props.className}`
        : "keisen-toolkit-indicator";

      return h("div", { class: rootClass, "aria-label": props.title }, [
        h("div", { class: "keisen-toolkit-indicator__header" }, [
          h("strong", props.title),
        ]),
        h(
          "div",
          { class: "keisen-toolkit-indicator__body" },
          props.groups.map((group) =>
            h("section", { class: "keisen-toolkit-indicator__section", key: group.title }, [
              h("h3", group.title),
              ...group.indicators.flatMap((indicator) => {
                const setting = props.settings[indicator.id];
                if (!setting) return [];
                const {
                  periodListField,
                  numberFields,
                  staticColorEntries,
                } = partitionIndicatorParamFields(indicator);

                return [
                  h("div", { class: "keisen-toolkit-indicator__row", key: indicator.id }, [
                    h("label", { class: "keisen-toolkit-indicator__toggle" }, [
                      h("input", {
                        type: "checkbox",
                        checked: setting.visible,
                        onInput: (event: Event) =>
                          props.setVisible(
                            indicator.id,
                            (event.target as HTMLInputElement).checked,
                          ),
                      }),
                      h("span", indicator.label),
                    ]),
                    h("div", { class: "keisen-toolkit-indicator__controls" }, [
                      periodListField
                        ? h(PeriodListEditor, {
                            field: periodListField,
                            indicatorId: indicator.id,
                            indicatorLabel: indicator.label,
                            setting,
                            setColor: props.setColor,
                            setParams: props.setParams,
                          })
                        : null,
                      h(NumberParamsEditor, {
                        fields: numberFields,
                        indicatorId: indicator.id,
                        setting,
                        setParams: props.setParams,
                      }),
                      staticColorEntries.length > 0
                        ? h("div", { class: "keisen-toolkit-indicator__param-block" }, [
                            (numberFields.length > 0 || periodListField) &&
                              h(
                                "div",
                                { class: "keisen-toolkit-indicator__param-title" },
                                "颜色",
                              ),
                            h(
                              "div",
                              { class: "keisen-toolkit-indicator__colors" },
                              staticColorEntries.map(([colorKey, label]) =>
                                h(
                                  "label",
                                  {
                                    class: "keisen-toolkit-indicator__color",
                                    key: colorKey,
                                    title: `${indicator.label} ${label} 颜色`,
                                  },
                                  [
                                    h("span", label),
                                    h(HexColorInput, {
                                      value:
                                        setting.colors[colorKey] ?? "#888888",
                                      disabled: !setting.visible,
                                      ariaLabel: `${indicator.label} ${label} 颜色`,
                                      onCommit: (color: string) =>
                                        props.setColor(
                                          indicator.id,
                                          colorKey,
                                          color,
                                        ),
                                    }),
                                  ],
                                ),
                              ),
                            ),
                          ])
                        : null,
                    ]),
                  ]),
                ];
              }),
            ]),
          ),
        ),
        h("div", { class: "keisen-toolkit-indicator__footer" }, [
          h(
            "button",
            {
              type: "button",
              class:
                "keisen-toolkit-indicator__btn keisen-toolkit-indicator__btn--ghost",
              onClick: () => props.reset(),
            },
            "重置",
          ),
          h(
            "button",
            {
              type: "button",
              class:
                "keisen-toolkit-indicator__btn keisen-toolkit-indicator__btn--primary",
              onClick: () => props.onConfirm?.(),
            },
            "确定",
          ),
        ]),
      ]);
    };
  },
});
