import type {
  IndicatorPanelProps,
  IndicatorParamField,
  IndicatorSetting,
} from "@keisen-charts/react/toolkit";
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
} from "@keisen-charts/react/toolkit";
import { useEffect, useState, type ChangeEvent } from "react";

import "./indicator-toolkit.css";

export type IndicatorSettingsPanelProps = IndicatorPanelProps & {
  className?: string;
  title?: string;
  onConfirm?: () => void;
};

function HexColorInput({
  value,
  disabled,
  ariaLabel,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  ariaLabel: string;
  onCommit: (color: string) => void;
}) {
  const committed = toColorInputValue(value);
  const [text, setText] = useState(committed);

  useEffect(() => {
    setText(committed);
  }, [committed]);

  const commitText = () => {
    const next = normalizeHex(text);
    if (!next) {
      setText(committed);
      return;
    }
    setText(next);
    if (next !== committed) onCommit(next);
  };

  return (
    <span className="keisen-toolkit-indicator__color-controls">
      <input
        type="color"
        value={committed}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onCommit(event.target.value.toLowerCase())}
      />
      <input
        type="text"
        className="keisen-toolkit-indicator__hex"
        value={text}
        disabled={disabled}
        spellCheck={false}
        maxLength={7}
        aria-label={`${ariaLabel} 十六进制`}
        placeholder="#000000"
        onChange={(event) => setText(event.target.value)}
        onBlur={commitText}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitText();
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
    </span>
  );
}

function PeriodListEditor({
  field,
  indicatorId,
  indicatorLabel,
  setting,
  setColor,
  setParams,
}: {
  field: Extract<IndicatorParamField, { kind: "periodList" }>;
  indicatorId: string;
  indicatorLabel: string;
  setting: IndicatorSetting;
  setColor: IndicatorPanelProps["setColor"];
  setParams: IndicatorPanelProps["setParams"];
}) {
  const periods = readPeriods(setting, field.key);
  const minItems = field.minItems ?? 1;
  const maxItems = field.maxItems ?? 12;
  const disabled = !setting.visible;

  const commitPeriods = (
    nextPeriods: number[],
    nextColors?: Record<string, string>,
  ) => {
    setParams(indicatorId, patchParams(setting, { [field.key]: nextPeriods }));
    if (!nextColors) return;
    for (const [key, color] of Object.entries(nextColors)) {
      if (setting.colors[key] !== color) setColor(indicatorId, key, color);
    }
  };

  const updatePeriodAt = (index: number, raw: string) => {
    const result = updatePeriodListAt(periods, setting, field, index, raw);
    if (!result) return;
    commitPeriods(result.nextPeriods, result.nextColors);
  };

  const removeAt = (index: number) => {
    const next = removePeriodListAt(periods, index, minItems);
    if (!next) return;
    commitPeriods(next);
  };

  const append = () => {
    const result = appendPeriodList(periods, setting, field, maxItems);
    if (!result) return;
    commitPeriods(result.nextPeriods, result.nextColors);
  };

  return (
    <div className="keisen-toolkit-indicator__param-block">
      <div className="keisen-toolkit-indicator__param-title">{field.label}</div>
      <div className="keisen-toolkit-indicator__period-list">
        {periods.map((period, index) => {
          const colorKey = `${field.colorKeyPrefix}${period}`;
          const label = `${indicatorLabel}${period}`;
          return (
            <div className="keisen-toolkit-indicator__period-row" key={`${colorKey}-${index}`}>
              <input
                type="number"
                className="keisen-toolkit-indicator__number"
                min={1}
                step={1}
                value={period}
                disabled={disabled}
                aria-label={`${label} 周期`}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updatePeriodAt(index, event.target.value)
                }
              />
              <HexColorInput
                value={setting.colors[colorKey] ?? "#888888"}
                disabled={disabled}
                ariaLabel={`${label} 颜色`}
                onCommit={(color) => setColor(indicatorId, colorKey, color)}
              />
              <button
                type="button"
                className="keisen-toolkit-indicator__icon-btn"
                disabled={disabled || periods.length <= minItems}
                aria-label={`移除 ${label}`}
                onClick={() => removeAt(index)}
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="keisen-toolkit-indicator__add-btn"
          disabled={disabled || periods.length >= maxItems}
          onClick={append}
        >
          + 添加{field.label}
        </button>
      </div>
    </div>
  );
}

function NumberParamsEditor({
  fields,
  indicatorId,
  setting,
  setParams,
}: {
  fields: Extract<IndicatorParamField, { kind: "number" }>[];
  indicatorId: string;
  setting: IndicatorSetting;
  setParams: IndicatorPanelProps["setParams"];
}) {
  if (fields.length === 0) return null;
  const disabled = !setting.visible;

  return (
    <div className="keisen-toolkit-indicator__param-block">
      <div className="keisen-toolkit-indicator__param-title">图表设置</div>
      <div className="keisen-toolkit-indicator__number-grid">
        {fields.map((field) => (
          <label className="keisen-toolkit-indicator__number-field" key={field.key}>
            <span>{field.label}</span>
            <input
              type="number"
              className="keisen-toolkit-indicator__number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={readNumberParam(setting, field.key)}
              disabled={disabled}
              aria-label={`${field.label}`}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) return;
                const min = field.min ?? Number.NEGATIVE_INFINITY;
                if (parsed < min) return;
                setParams(
                  indicatorId,
                  patchParams(setting, { [field.key]: parsed }),
                );
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Content-only indicator settings panel.
 * Mount inside your own shell (Popover, Vaul drawer, Dialog, etc.).
 */
export function IndicatorSettingsPanel({
  groups,
  settings,
  setVisible,
  setColor,
  setParams,
  reset,
  className,
  title = "指标设置",
  onConfirm,
}: IndicatorSettingsPanelProps) {
  const rootClass = className
    ? `keisen-toolkit-indicator ${className}`
    : "keisen-toolkit-indicator";

  return (
    <div className={rootClass} aria-label={title}>
      <div className="keisen-toolkit-indicator__header">
        <strong>{title}</strong>
      </div>
      <div className="keisen-toolkit-indicator__body">
        {groups.map((group) => (
          <section
            className="keisen-toolkit-indicator__section"
            key={group.title}
          >
            <h3>{group.title}</h3>
            {group.indicators.map((indicator) => {
              const setting = settings[indicator.id];
              if (!setting) return null;
              const {
                periodListField,
                numberFields,
                staticColorEntries,
              } = partitionIndicatorParamFields(indicator);

              return (
                <div
                  className="keisen-toolkit-indicator__row"
                  key={indicator.id}
                >
                  <label className="keisen-toolkit-indicator__toggle">
                    <input
                      type="checkbox"
                      checked={setting.visible}
                      onChange={(event) =>
                        setVisible(indicator.id, event.target.checked)
                      }
                    />
                    <span>{indicator.label}</span>
                  </label>
                  <div className="keisen-toolkit-indicator__controls">
                    {periodListField ? (
                      <PeriodListEditor
                        field={periodListField}
                        indicatorId={indicator.id}
                        indicatorLabel={indicator.label}
                        setting={setting}
                        setColor={setColor}
                        setParams={setParams}
                      />
                    ) : null}
                    <NumberParamsEditor
                      fields={numberFields}
                      indicatorId={indicator.id}
                      setting={setting}
                      setParams={setParams}
                    />
                    {staticColorEntries.length > 0 ? (
                      <div className="keisen-toolkit-indicator__param-block">
                        {(numberFields.length > 0 || periodListField) && (
                          <div className="keisen-toolkit-indicator__param-title">
                            颜色
                          </div>
                        )}
                        <div className="keisen-toolkit-indicator__colors">
                          {staticColorEntries.map(([colorKey, label]) => (
                            <label
                              className="keisen-toolkit-indicator__color"
                              key={colorKey}
                              title={`${indicator.label} ${label} 颜色`}
                            >
                              <span>{label}</span>
                              <HexColorInput
                                value={setting.colors[colorKey] ?? "#888888"}
                                disabled={!setting.visible}
                                ariaLabel={`${indicator.label} ${label} 颜色`}
                                onCommit={(color) =>
                                  setColor(indicator.id, colorKey, color)
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <div className="keisen-toolkit-indicator__footer">
        <button
          type="button"
          className="keisen-toolkit-indicator__btn keisen-toolkit-indicator__btn--ghost"
          onClick={reset}
        >
          重置
        </button>
        <button
          type="button"
          className="keisen-toolkit-indicator__btn keisen-toolkit-indicator__btn--primary"
          onClick={onConfirm}
        >
          确定
        </button>
      </div>
    </div>
  );
}
