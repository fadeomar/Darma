"use client";

import { useMemo, useState } from "react";
import { Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { CATEGORIES, convertValue, formatResult, getCategory, getUnit } from "./convert";

const DEFAULT_UNITS: Record<string, [string, string]> = {
  length: ["m", "ft"],
  mass: ["kg", "lb"],
  temperature: ["c", "f"],
  volume: ["l", "gal"],
  area: ["m2", "ft2"],
  speed: ["kmh", "mph"],
  digital: ["MB", "MiB"],
  time: ["h", "min"],
};

export default function UnitConverterClient() {
  const [categoryId, setCategoryId] = useState("length");
  const [fromId, setFromId] = useState(DEFAULT_UNITS.length[0]);
  const [toId, setToId] = useState(DEFAULT_UNITS.length[1]);
  const [rawValue, setRawValue] = useState("1");

  const category = getCategory(categoryId) ?? CATEGORIES[0];
  const value = Number.parseFloat(rawValue);
  const valid = rawValue.trim() !== "" && Number.isFinite(value);

  const fromUnit = getUnit(category, fromId);
  const toUnit = getUnit(category, toId);

  const result = useMemo(
    () => (valid ? convertValue(category.id, value, fromId, toId) : NaN),
    [valid, category.id, value, fromId, toId],
  );

  // Every unit in the category, with the current value converted into it.
  const allConversions = useMemo(() => {
    if (!valid) return [];
    return category.units.map((unit) => ({
      unit,
      value: convertValue(category.id, value, fromId, unit.id),
    }));
  }, [valid, category, value, fromId]);

  const resultText = formatResult(result);
  const summary =
    valid && fromUnit && toUnit
      ? `${formatResult(value)} ${fromUnit.symbol} = ${resultText} ${toUnit.symbol}`
      : "";

  function changeCategory(nextId: string) {
    const next = getCategory(nextId);
    if (!next) return;
    const [defFrom, defTo] = DEFAULT_UNITS[nextId] ?? [next.units[0].id, next.units[1]?.id ?? next.units[0].id];
    setCategoryId(nextId);
    setFromId(defFrom);
    setToId(defTo);
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Convert units" description="Pick a category, type a value, and choose the units. Everything is calculated in your browser.">
          <ControlSection title="Category">
            <Select value={categoryId} onChange={(event) => changeCategory(event.target.value)} aria-label="Category">
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </Select>
          </ControlSection>

          <ControlSection title="Value">
            <Input
              type="text"
              inputMode="decimal"
              value={rawValue}
              onChange={(event) => setRawValue(event.target.value)}
              aria-label="Value to convert"
              aria-invalid={!valid}
              placeholder="Enter a number"
            />
          </ControlSection>

          <ControlSection title="Units">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                From
                <Select className="mt-1" value={fromId} onChange={(event) => setFromId(event.target.value)} aria-label="From unit">
                  {category.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                To
                <Select className="mt-1" value={toId} onChange={(event) => setToId(event.target.value)} aria-label="To unit">
                  {category.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                  ))}
                </Select>
              </label>
            </ControlGrid>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={swap}>Swap units</Button>
            </div>
          </ControlSection>

          {!valid ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter a valid number to convert.</p>
          ) : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Result</h2>
            <CopyButton text={summary} size="sm" variant="secondary" disabled={!valid}>Copy result</CopyButton>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {valid && fromUnit && toUnit ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                <div className="text-3xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {resultText} <span className="text-xl text-[var(--color-text-tertiary)]">{toUnit.symbol}</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
                  {formatResult(value)} {fromUnit.symbol} = {resultText} {toUnit.symbol}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter a value to see the conversion.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <div className="space-y-4">
          {valid ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">All {category.label.toLowerCase()} units</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {allConversions.map(({ unit, value: converted }) => (
                  <div
                    key={unit.id}
                    className={`flex items-center justify-between gap-3 ${unit.id === toId ? "font-bold text-[var(--color-primary)]" : ""}`}
                  >
                    <dt className={unit.id === toId ? "" : "text-[var(--color-text-tertiary)]"}>{unit.name}</dt>
                    <dd className="font-mono font-semibold text-[var(--color-text-primary)]">
                      {formatResult(converted)} {unit.symbol}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          <WarningPanel messages={[{ id: "local", severity: "info", title: "Local calculation", message: "Conversions run in your browser. US customary units are used for volume." }]} />
        </div>
      }
    />
  );
}
