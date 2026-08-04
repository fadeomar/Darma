"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Input, Slider } from "@/components/ui";
import {
  FILTER_CONTROLS,
  clampAdjustmentValue,
  createDefaultFilterState,
  formatControlValue,
  formatEditableValue,
  parseEditableValue,
} from "../lib/adjustments";
import type { AdjustmentKey, FilterControl, PhotoAdjustments } from "../types";

function NumericAdjustment({
  control,
  value,
  onCommit,
}: {
  control: FilterControl;
  value: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => String(formatEditableValue(control, value)));
  const cancelledRef = useRef(false);

  useEffect(() => setDraft(String(formatEditableValue(control, value))), [control, value]);

  function commit() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setDraft(String(formatEditableValue(control, value)));
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(formatEditableValue(control, value)));
      return;
    }
    const next = parseEditableValue(control, parsed);
    onCommit(next);
    setDraft(String(formatEditableValue(control, next)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelledRef.current = true;
      setDraft(String(formatEditableValue(control, value)));
      event.currentTarget.blur();
    }
  }

  const suffix = control.display === "percent" || control.display === "signed-percent" ? "%" : control.unit;
  return (
    <div className="relative w-[5.75rem] shrink-0">
      <Input
        aria-label={`${control.label} numeric value`}
        inputMode="decimal"
        size="sm"
        width="full"
        className="pr-8 text-right tabular-nums"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
      {suffix ? <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[var(--color-text-tertiary)]">{suffix}</span> : null}
    </div>
  );
}

export function AdjustmentPanel({
  adjustments,
  onBeginSlider,
  onLiveValue,
  onCommitSlider,
  onCancelSlider,
  onCommitValue,
  onResetValue,
  onResetAll,
}: {
  adjustments: PhotoAdjustments;
  onBeginSlider: () => void;
  onLiveValue: (key: AdjustmentKey, value: number) => void;
  onCommitSlider: () => void;
  onCancelSlider: () => void;
  onCommitValue: (key: AdjustmentKey, value: number) => void;
  onResetValue: (key: AdjustmentKey) => void;
  onResetAll: () => void;
}) {
  const groups = ["Light", "Color", "Effects"] as const;
  const defaults = createDefaultFilterState();

  return (
    <section aria-label="Photo adjustments" className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-[var(--color-text-primary)]">Adjustments</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">Raster-only controls are marked.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onResetAll} disabled={Object.keys(adjustments).every((key) => adjustments[key as AdjustmentKey] === defaults[key as AdjustmentKey])}>
          Reset all
        </Button>
      </div>

      {groups.map((group, groupIndex) => (
        <details key={group} open={groupIndex === 0} className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
          <summary className="min-h-11 cursor-pointer list-none px-3 py-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
            {group}
          </summary>
          <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-3">
            {FILTER_CONTROLS.filter((control) => control.group === group).map((control) => {
              const value = adjustments[control.key];
              return (
                <div key={control.key} className="min-w-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor={`adjustment-${control.key}`} className="min-w-0 text-xs font-bold text-[var(--color-text-secondary)]">
                      {control.label}
                      {!control.cssCompatible ? <span className="ml-1 text-xs font-medium text-[var(--color-text-tertiary)]">Raster</span> : null}
                    </label>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="hidden min-w-12 text-right text-xs tabular-nums text-[var(--color-text-tertiary)] sm:block">{formatControlValue(control, value)}</span>
                      <NumericAdjustment control={control} value={value} onCommit={(next) => onCommitValue(control.key, next)} />
                      <Button
                        size="icon"
                        variant="ghost"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        aria-label={`Reset ${control.label}`}
                        title={`Reset ${control.label}`}
                        disabled={value === control.neutral}
                        onClick={() => onResetValue(control.key)}
                      >
                        Reset {control.label}
                      </Button>
                    </div>
                  </div>
                  <Slider
                    id={`adjustment-${control.key}`}
                    aria-label={`${control.label}, ${formatControlValue(control, value)}`}
                    aria-valuetext={formatControlValue(control, value)}
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    onPointerDown={(event) => {
                      onBeginSlider();
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerUp={(event) => {
                      onCommitSlider();
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                    }}
                    onPointerCancel={onCancelSlider}
                    onLostPointerCapture={onCommitSlider}
                    onBlur={onCommitSlider}
                    onKeyDown={(event) => {
                      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) onBeginSlider();
                    }}
                    onKeyUp={onCommitSlider}
                    onChange={(event) => onLiveValue(control.key, clampAdjustmentValue(control.key, Number(event.target.value)))}
                  />
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </section>
  );
}
