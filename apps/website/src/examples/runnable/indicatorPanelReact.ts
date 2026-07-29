/** React Sandpack sources for indicator settings popup (visibility + colors). */

export const REACT_INDICATOR_PANEL = `import {
  appendPeriodList,
  partitionIndicatorParamFields,
  patchParams,
  readPeriods,
  removePeriodListAt,
  toColorInputValue,
  updatePeriodListAt,
  type IndicatorPanelProps,
  type IndicatorParamField,
  type IndicatorSetting,
} from "@keisen-charts/react/toolkit";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import "./indicator-panel.css";

type PanelProps = IndicatorPanelProps & {
  onConfirm?: () => void;
};

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

  const commit = (
    nextPeriods: number[],
    nextColors?: Record<string, string>,
  ) => {
    setParams(indicatorId, patchParams(setting, { [field.key]: nextPeriods }));
    if (!nextColors) return;
    for (const [key, color] of Object.entries(nextColors)) {
      if (setting.colors[key] !== color) setColor(indicatorId, key, color);
    }
  };

  return (
    <div>
      <div className="keisen-toolkit-indicator__param-title">{field.label}</div>
      <div className="keisen-toolkit-indicator__period-list">
        {periods.map((period, index) => {
          const colorKey = \`\${field.colorKeyPrefix}\${period}\`;
          return (
            <div className="keisen-toolkit-indicator__period-row" key={\`\${colorKey}-\${index}\`}>
              <input
                type="number"
                className="keisen-toolkit-indicator__number"
                min={1}
                step={1}
                value={period}
                disabled={disabled}
                aria-label={\`\${indicatorLabel}\${period} 周期\`}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const result = updatePeriodListAt(
                    periods,
                    setting,
                    field,
                    index,
                    event.target.value,
                  );
                  if (result) commit(result.nextPeriods, result.nextColors);
                }}
              />
              <input
                type="color"
                value={toColorInputValue(setting.colors[colorKey] ?? "#888888")}
                disabled={disabled}
                aria-label={\`\${indicatorLabel}\${period} 颜色\`}
                onChange={(event) =>
                  setColor(indicatorId, colorKey, event.target.value.toLowerCase())
                }
              />
              <button
                type="button"
                className="keisen-toolkit-indicator__icon-btn"
                disabled={disabled || periods.length <= minItems}
                aria-label={\`移除 \${indicatorLabel}\${period}\`}
                onClick={() => {
                  const next = removePeriodListAt(periods, index, minItems);
                  if (next) commit(next);
                }}
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
          onClick={() => {
            const result = appendPeriodList(periods, setting, field, maxItems);
            if (result) commit(result.nextPeriods, result.nextColors);
          }}
        >
          + 添加{field.label}
        </button>
      </div>
    </div>
  );
}

export function IndicatorSettingsPanel({
  groups,
  settings,
  setVisible,
  setColor,
  setParams,
  reset,
  onConfirm,
}: PanelProps) {
  return (
    <div className="keisen-toolkit-indicator" aria-label="指标设置">
      <div className="keisen-toolkit-indicator__header">
        <strong>指标设置</strong>
      </div>
      <div className="keisen-toolkit-indicator__body">
        {groups.map((group) => (
          <section className="keisen-toolkit-indicator__section" key={group.title}>
            <h3>{group.title}</h3>
            {group.indicators.map((indicator) => {
              const setting = settings[indicator.id];
              if (!setting) return null;
              const { periodListField, staticColorEntries } =
                partitionIndicatorParamFields(indicator);

              return (
                <div className="keisen-toolkit-indicator__row" key={indicator.id}>
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
                    {staticColorEntries.length > 0 ? (
                      <div className="keisen-toolkit-indicator__colors">
                        {staticColorEntries.map(([colorKey, label]) => (
                          <label
                            className="keisen-toolkit-indicator__color"
                            key={colorKey}
                          >
                            <span>{label}</span>
                            <input
                              type="color"
                              value={toColorInputValue(
                                setting.colors[colorKey] ?? "#888888",
                              )}
                              disabled={!setting.visible}
                              aria-label={\`\${indicator.label} \${label} 颜色\`}
                              onChange={(event) =>
                                setColor(
                                  indicator.id,
                                  colorKey,
                                  event.target.value.toLowerCase(),
                                )
                              }
                            />
                          </label>
                        ))}
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
          className="keisen-toolkit-indicator__btn"
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

export function IndicatorToolbar({ panelProps }: { panelProps: IndicatorPanelProps }) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="indicator-host" ref={hostRef}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        指标设置
      </button>
      {open ? (
        <div className="indicator-shell">
          <IndicatorSettingsPanel
            {...panelProps}
            onConfirm={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
`;
