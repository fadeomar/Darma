"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Download, History, Printer, RotateCcw, Save, Target, Trash2 } from "lucide-react";
import { Badge, Button, CopyButton, Input, Select } from "@/components/ui";
import { ToolControlPanel, ControlSection, ControlGrid, SegmentedControl, WarningPanel } from "@/features/tools/components";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { cn } from "@/lib/cn";
import {
  bmiCategory,
  bmiImperial,
  bmiMetric,
  CATEGORY_EXPLANATION,
  CATEGORY_LABEL,
  feetInchesToInches,
  formatWeightDelta,
  healthyWeightKg,
  historyToCsv,
  kgToLb,
  lbToKg,
  round1,
  round2,
  targetBmi,
  validateMeasurementRange,
  waistToHeightCategory,
  waistToHeightMessage,
  waistToHeightRatio,
  weightDeltaToHealthyRange,
  WAIST_TO_HEIGHT_LABEL,
  type BmiCategory,
  type BmiHistoryEntry,
  type UnitSystem,
} from "./bmi";

const HISTORY_KEY = "darma:bmi-calculator:v1:history";

type ActivityLevel = "not-set" | "low" | "moderate" | "high";

const CATEGORY_BADGE: Record<BmiCategory, "warning" | "success" | "danger"> = {
  underweight: "warning",
  normal: "success",
  overweight: "warning",
  obese: "danger",
};

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  "not-set": "Not set",
  low: "Low activity",
  moderate: "Moderate activity",
  high: "High activity",
};

function parseNumber(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readHistory(): BmiHistoryEntry[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BmiHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: BmiHistoryEntry[]) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function BmiScale({ bmi }: { bmi: number }) {
  const percent = Math.min(100, Math.max(0, ((bmi - 12) / (42 - 12)) * 100));
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">BMI scale</p>
        <span className="font-mono text-xs font-bold text-[var(--color-text-secondary)]">12–42</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
        <div className="absolute inset-y-0 left-0 w-[21.7%] bg-[var(--color-warning-bg)]" />
        <div className="absolute inset-y-0 left-[21.7%] w-[21.3%] bg-[var(--color-success-bg)]" />
        <div className="absolute inset-y-0 left-[43%] w-[16.7%] bg-[var(--color-warning-bg)]" />
        <div className="absolute inset-y-0 left-[59.7%] right-0 bg-[var(--color-danger-bg)]" />
        <div className="absolute top-[-3px] h-[22px] w-1 rounded-full bg-[var(--color-text-primary)] shadow-[0_0_0_3px_var(--color-surface-base)]" style={{ left: `calc(${percent}% - 2px)` }} />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-[var(--color-text-tertiary)]">
        <span>Under</span>
        <span>Normal</span>
        <span>Over</span>
        <span>Obese</span>
      </div>
    </div>
  );
}

function MetricOrImperialWeight({ kg, system }: { kg: number; system: UnitSystem }) {
  return <>{system === "metric" ? `${round1(kg)} kg` : `${round1(kgToLb(kg))} lb`}</>;
}

function InsightCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{value}</div>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

export default function BmiCalculatorClient() {
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  const [lb, setLb] = useState("154");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");
  const [waistMetric, setWaistMetric] = useState("84");
  const [waistImperial, setWaistImperial] = useState("33");
  const [targetMetric, setTargetMetric] = useState("76");
  const [targetImperial, setTargetImperial] = useState("168");
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("not-set");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("not-set");
  const [pregnant, setPregnant] = useState(false);
  const [athlete, setAthlete] = useState(false);
  const [history, setHistory] = useState<BmiHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const snapshot = useMemo(() => {
    const weightKg = system === "metric" ? parseNumber(kg) : lbToKg(parseNumber(lb));
    const heightCm = system === "metric" ? parseNumber(cm) : feetInchesToInches(parseNumber(ft), parseNumber(inch)) * 2.54;
    const bmi = system === "metric" ? bmiMetric(weightKg, heightCm) : bmiImperial(parseNumber(lb), feetInchesToInches(parseNumber(ft), parseNumber(inch)));
    const category = bmiCategory(bmi);
    const waistCm = system === "metric" ? parseNumber(waistMetric) : parseNumber(waistImperial) * 2.54;
    const waistRatio = waistToHeightRatio(waistCm, heightCm);
    const targetWeightKg = system === "metric" ? parseNumber(targetMetric) : lbToKg(parseNumber(targetImperial));
    const projectedBmi = targetBmi(targetWeightKg, heightCm);
    const healthyRange = healthyWeightKg(heightCm);
    const delta = weightDeltaToHealthyRange(weightKg, heightCm);
    const baseWarnings = validateMeasurementRange({ weightKg, heightCm, waistCm: Number.isFinite(waistRatio) ? waistCm : null, age: parseNumber(age) });
    const contextWarnings = [
      pregnant ? "BMI is not designed to assess weight status during pregnancy." : null,
      athlete ? "High muscle mass can raise BMI even when body fat is not high." : null,
    ].filter(Boolean) as string[];
    return {
      weightKg,
      heightCm,
      bmi,
      category,
      waistRatio,
      waistCategory: waistToHeightCategory(waistRatio),
      projectedBmi,
      projectedCategory: bmiCategory(projectedBmi),
      healthyRange,
      delta,
      warnings: [...baseWarnings, ...contextWarnings],
    };
  }, [age, athlete, cm, ft, inch, kg, lb, pregnant, system, targetImperial, targetMetric, waistImperial, waistMetric]);

  const valid = snapshot.category !== null;

  const healthyText = useMemo(() => {
    if (!snapshot.healthyRange) return "—";
    if (system === "metric") return `${round1(snapshot.healthyRange.min)}–${round1(snapshot.healthyRange.max)} kg`;
    return `${round1(kgToLb(snapshot.healthyRange.min))}–${round1(kgToLb(snapshot.healthyRange.max))} lb`;
  }, [snapshot.healthyRange, system]);

  const summary = useMemo(() => {
    if (!valid || !snapshot.category) return "";
    const lines = [
      `BMI Health Snapshot`,
      `BMI: ${round1(snapshot.bmi)} (${CATEGORY_LABEL[snapshot.category]})`,
      `Healthy weight range: ${healthyText}`,
      `Range comparison: ${formatWeightDelta(snapshot.delta, system)}`,
    ];
    if (snapshot.waistCategory) {
      lines.push(`Waist-to-height ratio: ${round2(snapshot.waistRatio)} (${WAIST_TO_HEIGHT_LABEL[snapshot.waistCategory]})`);
    }
    if (Number.isFinite(snapshot.projectedBmi)) {
      lines.push(`Target BMI: ${round1(snapshot.projectedBmi)}`);
    }
    lines.push("Note: BMI is a general screening tool, not a medical diagnosis.");
    return lines.join("\n");
  }, [healthyText, snapshot, system, valid]);

  const saveResult = useCallback(() => {
    if (!valid || !snapshot.category) return;
    const entry: BmiHistoryEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      system,
      bmi: snapshot.bmi,
      category: snapshot.category,
      weight: system === "metric" ? round1(snapshot.weightKg) : round1(kgToLb(snapshot.weightKg)),
      weightUnit: system === "metric" ? "kg" : "lb",
      heightCm: snapshot.heightCm,
      waistToHeightRatio: Number.isFinite(snapshot.waistRatio) ? snapshot.waistRatio : null,
      targetBmi: Number.isFinite(snapshot.projectedBmi) ? snapshot.projectedBmi : null,
    };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    writeHistory(next);
  }, [history, snapshot, system, valid]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeHistory([]);
  }, []);

  const latestComparison = useMemo(() => {
    if (history.length < 2) return null;
    const diff = round1(history[0].bmi - history[1].bmi);
    if (diff === 0) return "No BMI change from the previous saved result.";
    return `${Math.abs(diff)} BMI point${Math.abs(diff) === 1 ? "" : "s"} ${diff > 0 ? "higher" : "lower"} than the previous saved result.`;
  }, [history]);

  const warnings = [
    ...snapshot.warnings.map((message, index) => ({ id: `range-${index}`, severity: "warning" as const, title: "Check your context", message })),
    { id: "guide", severity: "info" as const, title: "Screening guide only", message: "BMI does not measure body fat directly and does not replace advice from a doctor or dietitian." },
  ];

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel title="Body health snapshot" description="Enter measurements to get BMI, healthy range, waist ratio, target BMI, and local history.">
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
            <ControlSection title="Main measurements">
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (kg)
                  <Input className="mt-1" type="text" inputMode="decimal" value={kg} onChange={(event) => setKg(event.target.value)} aria-label="Weight in kilograms" />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Height (cm)
                  <Input className="mt-1" type="text" inputMode="decimal" value={cm} onChange={(event) => setCm(event.target.value)} aria-label="Height in centimeters" />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Waist optional (cm)
                  <Input className="mt-1" type="text" inputMode="decimal" value={waistMetric} onChange={(event) => setWaistMetric(event.target.value)} aria-label="Waist in centimeters" />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Target weight (kg)
                  <Input className="mt-1" type="text" inputMode="decimal" value={targetMetric} onChange={(event) => setTargetMetric(event.target.value)} aria-label="Target weight in kilograms" />
                </label>
              </ControlGrid>
            </ControlSection>
          ) : (
            <ControlSection title="Main measurements">
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (lb)
                  <Input className="mt-1" type="text" inputMode="decimal" value={lb} onChange={(event) => setLb(event.target.value)} aria-label="Weight in pounds" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Height (ft)
                    <Input className="mt-1" type="text" inputMode="numeric" value={ft} onChange={(event) => setFt(event.target.value)} aria-label="Height feet" />
                  </label>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Height (in)
                    <Input className="mt-1" type="text" inputMode="decimal" value={inch} onChange={(event) => setInch(event.target.value)} aria-label="Height inches" />
                  </label>
                </div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Waist optional (in)
                  <Input className="mt-1" type="text" inputMode="decimal" value={waistImperial} onChange={(event) => setWaistImperial(event.target.value)} aria-label="Waist in inches" />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Target weight (lb)
                  <Input className="mt-1" type="text" inputMode="decimal" value={targetImperial} onChange={(event) => setTargetImperial(event.target.value)} aria-label="Target weight in pounds" />
                </label>
              </ControlGrid>
            </ControlSection>
          )}

          <ControlSection title="Context">
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Age optional
                <Input className="mt-1" type="text" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} aria-label="Age" />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Gender optional
                <Select className="mt-1" value={gender} onChange={(event) => setGender(event.target.value)} aria-label="Gender">
                  <option value="not-set">Not set</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="another">Another / prefer not to say</option>
                </Select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Activity optional
                <Select className="mt-1" value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)} aria-label="Activity level">
                  {Object.entries(ACTIVITY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={pregnant} onChange={(event) => setPregnant(event.target.checked)} /> Pregnant</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={athlete} onChange={(event) => setAthlete(event.target.checked)} /> Athlete / high muscle</label>
              </div>
            </ControlGrid>
          </ControlSection>

          {!valid ? <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">Enter a positive weight and height.</p> : null}
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Private browser result</p>
              <h2 className="text-sm font-bold tracking-[-0.01em] text-[var(--color-text-primary)]">Health snapshot</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={summary} size="sm" variant="secondary" disabled={!valid}>Copy</CopyButton>
              <Button size="sm" variant="secondary" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />} disabled={!valid}>Print</Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {valid && snapshot.category ? (
              <>
                <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 shadow-[inset_0_1px_0_var(--color-border-subtle)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">BMI score</div>
                        <div className="mt-1 text-6xl font-black tracking-tight text-[var(--color-text-primary)]">{round1(snapshot.bmi)}</div>
                      </div>
                      <Badge variant={CATEGORY_BADGE[snapshot.category]}>{CATEGORY_LABEL[snapshot.category]}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">{CATEGORY_EXPLANATION[snapshot.category]}</p>
                  </div>
                  <BmiScale bmi={snapshot.bmi} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InsightCard label="Healthy range" value={healthyText} description="Calculated from the adult BMI range of 18.5–24.9 for your height." />
                  <InsightCard label="Range gap" value={formatWeightDelta(snapshot.delta, system)} description="Shows the shortest change needed to enter the adult healthy BMI range." />
                  <InsightCard
                    label="Waist-to-height"
                    value={snapshot.waistCategory ? `${round2(snapshot.waistRatio)} · ${WAIST_TO_HEIGHT_LABEL[snapshot.waistCategory]}` : "Not available"}
                    description={waistToHeightMessage(snapshot.waistRatio)}
                  />
                  <InsightCard
                    label="Target BMI"
                    value={Number.isFinite(snapshot.projectedBmi) ? `${round1(snapshot.projectedBmi)}${snapshot.projectedCategory ? ` · ${CATEGORY_LABEL[snapshot.projectedCategory]}` : ""}` : "Not available"}
                    description="Enter a target weight to preview where that weight would sit on the BMI scale."
                  />
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
                    <Target className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                    Target planner
                  </div>
                  <div className="grid gap-3 text-sm text-[var(--color-text-secondary)] sm:grid-cols-3">
                    <div><span className="font-bold text-[var(--color-text-primary)]">Current:</span> <MetricOrImperialWeight kg={snapshot.weightKg} system={system} /></div>
                    <div><span className="font-bold text-[var(--color-text-primary)]">Healthy top:</span> {snapshot.healthyRange ? <MetricOrImperialWeight kg={snapshot.healthyRange.max} system={system} /> : "—"}</div>
                    <div><span className="font-bold text-[var(--color-text-primary)]">Context:</span> {ACTIVITY_LABEL[activityLevel]}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[360px] flex-1 items-center justify-center text-center text-sm text-[var(--color-text-tertiary)]">
                Enter your weight and height to see your BMI health snapshot.
              </div>
            )}
          </div>
        </section>
      }
      statsSlot={
        <div className="space-y-4">
          <WarningPanel messages={warnings} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><History className="h-4 w-4" aria-hidden /></span>
                <div>
                  <h3 className="text-sm font-black text-[var(--color-text-primary)]">Local history</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Saved only in this browser.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={saveResult} disabled={!valid} leftIcon={<Save className="h-4 w-4" />}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => downloadText("bmi-history.csv", historyToCsv(history), "text/csv")} disabled={history.length === 0} leftIcon={<Download className="h-4 w-4" />}>CSV</Button>
                <Button size="sm" variant="danger" onClick={clearHistory} disabled={history.length === 0} leftIcon={<Trash2 className="h-4 w-4" />}>Clear</Button>
              </div>
            </div>
            {latestComparison ? <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">{latestComparison}</p> : null}
            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {history.length === 0 ? (
                <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-4 text-center text-xs text-[var(--color-text-tertiary)]">No saved results yet.</p>
              ) : history.map((entry) => (
                <div key={entry.id} className={cn("flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs", entry.category === "normal" ? "" : "") }>
                  <div>
                    <div className="font-bold text-[var(--color-text-primary)]">BMI {round1(entry.bmi)} · {CATEGORY_LABEL[entry.category]}</div>
                    <div className="text-[var(--color-text-tertiary)]">{new Date(entry.createdAt).toLocaleString()} · {entry.weight} {entry.weightUnit}</div>
                  </div>
                  <Activity className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden />
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} leftIcon={<RotateCcw className="h-4 w-4" />}>Reset tool</Button>
        </div>
      }
    />
  );
}
