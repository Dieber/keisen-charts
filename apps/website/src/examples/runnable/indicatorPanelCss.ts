/** Shared light-theme skin for the docs indicator settings popup. */
export const INDICATOR_PANEL_CSS = `.indicator-host {
  position: relative;
  display: inline-block;
}

.indicator-shell {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  left: 0;
}

.keisen-toolkit-indicator {
  display: flex;
  flex-direction: column;
  width: 480px;
  max-width: min(480px, calc(100vw - 24px));
  height: 460px;
  max-height: min(460px, calc(100vh - 90px));
  overflow: hidden;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  background: #fff;
  color: #18181b;
  box-shadow: 0 16px 40px rgb(0 0 0 / 16%);
  font-size: 13px;
}

.keisen-toolkit-indicator__header,
.keisen-toolkit-indicator__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e4e4e7;
}

.keisen-toolkit-indicator__footer {
  justify-content: flex-end;
  gap: 8px;
  border-bottom: none;
  border-top: 1px solid #e4e4e7;
}

.keisen-toolkit-indicator__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 4px 14px 12px;
}

.keisen-toolkit-indicator__section h3 {
  margin: 12px 0 6px;
  color: #71717a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.keisen-toolkit-indicator__row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid #e4e4e7;
}

.keisen-toolkit-indicator__toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 25px;
  cursor: pointer;
}

.keisen-toolkit-indicator__controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.keisen-toolkit-indicator__param-title {
  color: #71717a;
  font-size: 11px;
}

.keisen-toolkit-indicator__colors,
.keisen-toolkit-indicator__period-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.keisen-toolkit-indicator__period-list {
  flex-direction: column;
}

.keisen-toolkit-indicator__period-row,
.keisen-toolkit-indicator__color {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #71717a;
  font-size: 11px;
}

.keisen-toolkit-indicator__number {
  width: 56px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d4d4d8;
  border-radius: 5px;
  background: #f4f4f5;
}

.keisen-toolkit-indicator__number:disabled {
  opacity: 0.35;
}

.keisen-toolkit-indicator input[type="color"] {
  width: 25px;
  height: 25px;
  padding: 2px;
  border: 1px solid #d4d4d8;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.keisen-toolkit-indicator input[type="color"]:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.keisen-toolkit-indicator__icon-btn,
.keisen-toolkit-indicator__add-btn,
.keisen-toolkit-indicator__btn {
  height: 28px;
  border: 1px solid #d4d4d8;
  border-radius: 5px;
  background: transparent;
  color: #52525b;
  font-size: 12px;
  cursor: pointer;
}

.keisen-toolkit-indicator__icon-btn {
  width: 28px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
}

.keisen-toolkit-indicator__add-btn {
  align-self: flex-start;
  padding: 0 10px;
}

.keisen-toolkit-indicator__btn {
  min-width: 72px;
  height: 32px;
  padding: 0 14px;
}

.keisen-toolkit-indicator__btn--primary {
  border-color: #3b82f6;
  background: #3b82f6;
  color: #fff;
}

.keisen-toolkit-indicator__icon-btn:disabled,
.keisen-toolkit-indicator__add-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
`;
