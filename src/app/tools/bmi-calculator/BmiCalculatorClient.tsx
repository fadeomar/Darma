"use client";

import { useMemo, useState } from "react";
import { CopyButton, Input } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, SegmentedControl, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import {
  bmiCategory,
  bmiImperial,
  bmiMetric,
  CATEGORY_LABEL,
  feetInchesToInches,
  healthyWeightKg,
  kgToLb,
  round1,
  type BmiCategory,
  type UnitSystem,
} from "./bmi";

const CATEGORY_COLOR: Record<BmiCategory, string> = {
  underweight: "var(--color-warning, #b45309)",
  normal: "var(--color-success, #15803d)",
  overweight: "var(--color-warning, #b45309)",
  obese: "var(--color-danger)",
};

export default function BmiCalculatorClient() {
  const [system, setSystem] = useState<UnitSystem>("metric");
  // Metric
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  // Imperial
  const [lb, setLb] = useState("154");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");

  const { bmi, heightCm } = useMemo(() => {
    if (system === "metric") {
      return { bmi: bmiMetric(Number.parseFloat(kg), Number.parseFloat(cm)), heightCm: Number.parseFloat(cm) };
    }
    const inches = feetInchesToInches(Number.parseFloat(ft), Number.parseFloat(inch));
    return { bmi: bmiImperial(Number.parseFloat(lb), inches), heightCm: inches * 2.54 };
  }, [system, kg, cm, lb, ft, inch]);

  const category = bmiCategory(bmi);
  const range = healthyWeightKg(heightCm);
  const valid = category !== null;

  const healthyText = useMemo(() => {
    if (!range) return "";
    if (system === "metric") return `${round1(range.min)}–${round1(range.max)} kg`;
    return `${round1(kgToLb(range.min))}–${round1(kgToLb(range.max))} lb`;
  }, [range, system]);

  const summary = valid && category
    ? `BMI: ${round1(bmi)} (${CATEGORY_LABEL[category]})\nHealthy range for your height: ${healthyText}`
    : "";

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Your measurements" description="Enter your weight and height. BMI updates as you type — nothing is uploaded.">
          <ControlSection title="Units">
            <SegmentedControl
              ariaLabel="Unit system"
              value={system}
              onChange={(value) => setSystem(value as UnitSystem)}
              options={[
                { value: "metric", label: "Metric (kg, cm)" },
                { value: "imperial", label: "Imperial (lb, ft/in)" },
              ]}
            />
          </ControlSection>

          {system === "metric" ? (
            <ControlSection title="Weight & height">
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (kg)
                  <Input className="mt-1" type="text" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Weight in kilograms" />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Height (cm)
                  <Input className="mt-1" type="text" inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} aria-label="Height in centimeters" />
                </label>
              </ControlGrid>
            </ControlSection>
          ) : (
            <ControlSection title="Weight & height">
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (lb)
                  <Input className="mt-1" type="text" inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} aria-label="Weight in pounds" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Height (ft)
                    <Input className="mt-1" type="text" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} aria-label="Height feet" />
                  </label>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    (in)
                    <Input className="mt-1" type="text" inputMode="decimal" value={inch} onChange={(e) => setInch(e.target.value)} aria-label="Height inches" />
                  </label>
                </div>
              </ControlGrid>
            </ControlSection>
          )}

          {!valid ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter a positive weight and height.</p>
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
            {valid && category ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 text-center shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                  <div className="text-5xl font-black tracking-tight text-[var(--color-text-primary)]">{round1(bmi)}</div>
                  <div className="mt-2 inline-block rounded-[var(--radius-full)] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: CATEGORY_COLOR[category], borderColor: CATEGORY_COLOR[category], borderWidth: 1 }}>
                    {CATEGORY_LABEL[category]}
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Healthy weight for your height</div>
                  <div className="mt-1 font-mono text-lg font-black text-[var(--color-text-primary)]">{healthyText}</div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                Enter your weight and height to see your BMI.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <WarningPanel
          messages={[
            { id: "bands", severity: "info", title: "BMI categories", message: "Under 18.5 underweight · 18.5–24.9 normal · 25–29.9 overweight · 30+ obese." },
            { id: "note", severity: "warning", title: "A general guide only", message: "BMI does not account for muscle mass, age, or body composition. It is a screening tool, not a diagnosis." },
          ]}
        />
      }
    />
  );
}
