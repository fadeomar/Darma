"use client";

import JSZip from "jszip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  Download,
  FileJson,
  FileText,
  History,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge, Button, CopyButton, Input } from "@/components/ui";
import {
  ControlGrid,
  ControlSection,
  SegmentedControl,
  ToolControlPanel,
  WarningPanel,
  type WarningMessage,
} from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import { ToolLayoutTextWorkbench } from "@/features/tools/layouts";
import { cn } from "@/lib/cn";
import {
  CATEGORY_EXPLANATION,
  CATEGORY_LABEL,
  WAIST_TO_HEIGHT_LABEL,
  cmToInches,
  feetInchesToInches,
  formatWeightDelta,
  historyToCsv,
  kgToLb,
  lbToKg,
  round1,
  round2,
  waistToHeightMessage,
  type BmiCategory,
  type BmiHistoryEntry,
  type UnitSystem,
} from "./bmi";
import {
  BMI_DISCLAIMER,
  DEFAULT_BMI_CONFIG,
  buildBmiAudit,
  buildBmiMarkdownReport,
  buildBmiSnapshotCsv,
  buildBmiProductionFiles,
  buildBmiSummaryCards,
  calculateBmiScreening,
  createBmiProject,
  parseBmiProject,
  summarizeBmiAudit,
  type BmiAuditCheck,
  type BmiScreeningConfig,
} from "./studio";

const HISTORY_KEY = "darma:bmi-calculator:v1:history";
const IMPORT_LIMIT_BYTES = 1_000_000;

const CATEGORY_BADGE: Record<BmiCategory, "warning" | "success" | "danger"> = {
  underweight: "warning",
  normal: "success",
  overweight: "warning",
  obese: "danger",
};

function parseNumber(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function parseOptionalNumber(value: string): number | null {
  return value.trim() ? parseNumber(value) : null;
}

function formatInput(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(digits)).toString();
}

function storageAvailable() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function isHistoryEntry(value: unknown): value is BmiHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<BmiHistoryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "string" &&
    (entry.system === "metric" || entry.system === "imperial") &&
    typeof entry.bmi === "number" &&
    Number.isFinite(entry.bmi) &&
    (entry.category === "underweight" ||
      entry.category === "normal" ||
      entry.category === "overweight" ||
      entry.category === "obese") &&
    typeof entry.weight === "number" &&
    (entry.weightUnit === "kg" || entry.weightUnit === "lb") &&
    typeof entry.heightCm === "number"
  );
}

function readHistory(): BmiHistoryEntry[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isHistoryEntry).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: BmiHistoryEntry[]) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(entries.slice(0, 20)),
  );
}

function BmiScale({ bmi }: { bmi: number }) {
  const percent = Math.min(100, Math.max(0, ((bmi - 12) / 30) * 100));
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Adult BMI scale
        </p>
        <span className="font-mono text-xs font-bold text-[var(--color-text-secondary)]">
          12–42+
        </span>
      </div>
      <div className="relative h-4 overflow-hidden rounded-[var(--radius-full)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
        <div className="absolute inset-y-0 left-0 w-[21.7%] bg-[var(--color-warning-bg)]" />
        <div className="absolute inset-y-0 left-[21.7%] w-[21.6%] bg-[var(--color-success-bg)]" />
        <div className="absolute inset-y-0 left-[43.3%] w-[16.7%] bg-[var(--color-warning-bg)]" />
        <div className="absolute inset-y-0 left-[60%] right-0 bg-[var(--color-danger-bg)]" />
        <div
          className="absolute top-[-3px] h-[22px] w-1 rounded-full bg-[var(--color-text-primary)] shadow-[0_0_0_3px_var(--color-surface-base)]"
          style={{ left: `calc(${percent}% - 2px)` }}
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs font-bold text-[var(--color-text-tertiary)]">
        <span>Under</span>
        <span>Healthy</span>
        <span>Over</span>
        <span>Obesity</span>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="mt-1 break-words text-base font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
        {detail}
      </p>
    </div>
  );
}

function auditToWarning(check: BmiAuditCheck): WarningMessage {
  return {
    id: check.id,
    title: check.title,
    message: check.message,
    severity:
      check.severity === "error"
        ? "danger"
        : check.severity === "warning"
          ? "warning"
          : check.severity === "pass"
            ? "success"
            : "info",
  };
}

export default function BmiCalculatorClient() {
  const importRef = useRef<HTMLInputElement>(null);
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  const [lb, setLb] = useState("154.3");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("8.9");
  const [waistMetric, setWaistMetric] = useState("84");
  const [waistImperial, setWaistImperial] = useState("33.1");
  const [targetMetric, setTargetMetric] = useState("76");
  const [targetImperial, setTargetImperial] = useState("167.6");
  const [age, setAge] = useState("28");
  const [pregnant, setPregnant] = useState(false);
  const [athlete, setAthlete] = useState(false);
  const [history, setHistory] = useState<BmiHistoryEntry[]>([]);
  const [importMessage, setImportMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [packing, setPacking] = useState(false);

  useEffect(() => setHistory(readHistory()), []);

  const config = useMemo<BmiScreeningConfig>(() => {
    const heightCm =
      system === "metric"
        ? parseNumber(cm)
        : feetInchesToInches(parseNumber(ft), parseNumber(inch)) * 2.54;
    return {
      system,
      weightKg: system === "metric" ? parseNumber(kg) : lbToKg(parseNumber(lb)),
      heightCm,
      waistCm:
        system === "metric"
          ? parseOptionalNumber(waistMetric)
          : waistImperial.trim()
            ? parseNumber(waistImperial) * 2.54
            : null,
      targetWeightKg:
        system === "metric"
          ? parseOptionalNumber(targetMetric)
          : targetImperial.trim()
            ? lbToKg(parseNumber(targetImperial))
            : null,
      age: parseOptionalNumber(age),
      pregnant,
      athlete,
    };
  }, [
    age,
    athlete,
    cm,
    ft,
    inch,
    kg,
    lb,
    pregnant,
    system,
    targetImperial,
    targetMetric,
    waistImperial,
    waistMetric,
  ]);

  const snapshot = useMemo(() => calculateBmiScreening(config), [config]);
  const auditChecks = useMemo(() => buildBmiAudit(snapshot), [snapshot]);
  const auditSummary = useMemo(
    () => summarizeBmiAudit(auditChecks),
    [auditChecks],
  );
  const summaryCards = useMemo(
    () => buildBmiSummaryCards(snapshot, auditChecks),
    [auditChecks, snapshot],
  );
  const valid = snapshot.category !== null;

  const summaryText = useMemo(() => {
    if (!valid || !snapshot.category) return "";
    return [
      "BMI Screening Snapshot",
      `BMI: ${round1(snapshot.bmi)} (${CATEGORY_LABEL[snapshot.category]})`,
      `Healthy-range comparison: ${formatWeightDelta(snapshot.delta, system)}`,
      Number.isFinite(snapshot.waistRatio)
        ? `Waist-to-height ratio: ${round2(snapshot.waistRatio)}${snapshot.waistCategory ? ` (${WAIST_TO_HEIGHT_LABEL[snapshot.waistCategory]})` : ""}`
        : "Waist-to-height ratio: not set",
      `Applicability: ${auditSummary.label}`,
      BMI_DISCLAIMER,
    ].join("\n");
  }, [auditSummary.label, snapshot, system, valid]);

  const applyConfig = useCallback((next: BmiScreeningConfig) => {
    setSystem(next.system);
    setKg(formatInput(next.weightKg));
    setCm(formatInput(next.heightCm));
    setLb(formatInput(kgToLb(next.weightKg)));
    const totalInches = cmToInches(next.heightCm);
    const feet = Math.floor(totalInches / 12);
    setFt(formatInput(feet, 0));
    setInch(formatInput(totalInches - feet * 12));
    setWaistMetric(next.waistCm === null ? "" : formatInput(next.waistCm));
    setWaistImperial(
      next.waistCm === null ? "" : formatInput(next.waistCm / 2.54),
    );
    setTargetMetric(
      next.targetWeightKg === null ? "" : formatInput(next.targetWeightKg),
    );
    setTargetImperial(
      next.targetWeightKg === null
        ? ""
        : formatInput(kgToLb(next.targetWeightKg)),
    );
    setAge(next.age === null ? "" : formatInput(next.age, 0));
    setPregnant(next.pregnant);
    setAthlete(next.athlete);
  }, []);

  const changeSystem = useCallback(
    (nextSystem: UnitSystem) => {
      if (nextSystem === system) return;
      setSystem(nextSystem);
      if (
        !Number.isFinite(config.weightKg) ||
        !Number.isFinite(config.heightCm)
      )
        return;
      applyConfig({ ...config, system: nextSystem });
    },
    [applyConfig, config, system],
  );

  const saveResult = useCallback(() => {
    if (!valid || !snapshot.category) return;
    const entry: BmiHistoryEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      system,
      bmi: snapshot.bmi,
      category: snapshot.category,
      weight:
        system === "metric"
          ? round1(config.weightKg)
          : round1(kgToLb(config.weightKg)),
      weightUnit: system === "metric" ? "kg" : "lb",
      heightCm: config.heightCm,
      waistToHeightRatio: Number.isFinite(snapshot.waistRatio)
        ? snapshot.waistRatio
        : null,
      targetBmi: Number.isFinite(snapshot.targetBmi)
        ? snapshot.targetBmi
        : null,
    };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    writeHistory(next);
  }, [config.heightCm, config.weightKg, history, snapshot, system, valid]);

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

  function downloadProjectJson() {
    downloadTextFile({
      filename: "bmi-screening.json",
      content: JSON.stringify(createBmiProject(config), null, 2),
      mimeType: "application/json;charset=utf-8",
    });
  }

  function downloadMarkdown() {
    downloadTextFile({
      filename: "bmi-screening-report.md",
      content: buildBmiMarkdownReport(snapshot, auditChecks),
    });
  }

  function downloadSnapshotCsv() {
    downloadTextFile({
      filename: "bmi-screening.csv",
      content: buildBmiSnapshotCsv(snapshot, auditChecks),
      mimeType: "text/csv;charset=utf-8",
    });
  }

  async function downloadProductionPack() {
    if (!valid) return;
    setPacking(true);
    try {
      const zip = new JSZip();
      for (const [filename, content] of Object.entries(
        buildBmiProductionFiles(snapshot, auditChecks),
      )) {
        zip.file(filename, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "bmi-screening-pack.zip" });
    } finally {
      setPacking(false);
    }
  }

  async function importProject(file: File) {
    setImportMessage(null);
    if (file.size > IMPORT_LIMIT_BYTES) {
      setImportMessage({
        kind: "error",
        text: "The project file is larger than 1 MB.",
      });
      return;
    }
    try {
      const imported = parseBmiProject(await file.text());
      applyConfig(imported);
      setImportMessage({
        kind: "success",
        text: "BMI screening settings imported successfully.",
      });
    } catch (error) {
      setImportMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not import the project file.",
      });
    }
  }

  const statusVariant =
    auditSummary.status === "ready"
      ? "success"
      : auditSummary.status === "review"
        ? "warning"
        : "danger";

  return (
    <ToolLayoutTextWorkbench
      inputSlot={
        <ToolControlPanel
          title="Measurements and context"
          description="Adult screening calculations only. Unit switching preserves the same measurements instead of restoring stale values."
        >
          <ControlSection
            title="Quick setup"
            description="Use an example to test the tool, import a saved Darma project, or clear optional measurements."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyConfig(DEFAULT_BMI_CONFIG)}
              >
                Metric example
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  applyConfig({ ...DEFAULT_BMI_CONFIG, system: "imperial" })
                }
              >
                Imperial example
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  applyConfig({
                    ...config,
                    waistCm: null,
                    targetWeightKg: null,
                  })
                }
              >
                Clear optional
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Upload className="h-4 w-4" aria-hidden />}
                onClick={() => importRef.current?.click()}
              >
                Import JSON
              </Button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importProject(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            {importMessage ? (
              <p
                role="status"
                className={cn(
                  "rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-semibold",
                  importMessage.kind === "success"
                    ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                    : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
                )}
              >
                {importMessage.text}
              </p>
            ) : null}
          </ControlSection>

          <ControlSection title="Units">
            <SegmentedControl<UnitSystem>
              ariaLabel="Unit system"
              value={system}
              onChange={changeSystem}
              options={[
                { value: "metric", label: "Metric (kg, cm)" },
                { value: "imperial", label: "Imperial (lb, ft/in)" },
              ]}
              fullWidth
            />
          </ControlSection>

          <ControlSection title="Measurements">
            {system === "metric" ? (
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (kg)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={kg}
                    onChange={(event) => setKg(event.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Height (cm)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={cm}
                    onChange={(event) => setCm(event.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Waist, optional (cm)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={waistMetric}
                    onChange={(event) => setWaistMetric(event.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Target weight, optional (kg)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={targetMetric}
                    onChange={(event) => setTargetMetric(event.target.value)}
                  />
                </label>
              </ControlGrid>
            ) : (
              <ControlGrid columns={2}>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Weight (lb)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={lb}
                    onChange={(event) => setLb(event.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Height (ft)
                    <Input
                      className="mt-1"
                      inputMode="numeric"
                      value={ft}
                      onChange={(event) => setFt(event.target.value)}
                    />
                  </label>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Height (in)
                    <Input
                      className="mt-1"
                      inputMode="decimal"
                      value={inch}
                      onChange={(event) => setInch(event.target.value)}
                    />
                  </label>
                </div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Waist, optional (in)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={waistImperial}
                    onChange={(event) => setWaistImperial(event.target.value)}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Target weight, optional (lb)
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={targetImperial}
                    onChange={(event) => setTargetImperial(event.target.value)}
                  />
                </label>
              </ControlGrid>
            )}
          </ControlSection>

          <ControlSection
            title="Applicability context"
            description="These fields change the interpretation audit, not the BMI formula."
          >
            <ControlGrid columns={2}>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Age, optional
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                />
              </label>
              <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pregnant}
                    onChange={(event) => setPregnant(event.target.checked)}
                  />{" "}
                  Pregnancy context
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={athlete}
                    onChange={(event) => setAthlete(event.target.checked)}
                  />{" "}
                  Athlete / high muscle mass
                </label>
              </div>
            </ControlGrid>
          </ControlSection>
        </ToolControlPanel>
      }
      outputSlot={
        <section className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/75 px-4 py-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Private browser result
              </p>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                BMI screening snapshot
              </h2>
            </div>
            <Badge variant={statusVariant}>{auditSummary.label}</Badge>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard key={card.label} {...card} />
              ))}
            </div>
            {valid && snapshot.category ? (
              <>
                <div className="grid gap-3 lg:grid-cols-[1fr_1.15fr]">
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                          BMI score
                        </div>
                        <div className="mt-1 text-6xl font-black tracking-tight text-[var(--color-text-primary)]">
                          {round1(snapshot.bmi)}
                        </div>
                      </div>
                      <Badge variant={CATEGORY_BADGE[snapshot.category]}>
                        {CATEGORY_LABEL[snapshot.category]}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {CATEGORY_EXPLANATION[snapshot.category]}
                    </p>
                  </div>
                  <BmiScale bmi={snapshot.bmi} />
                </div>
                <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      Healthy-range comparison:
                    </span>{" "}
                    {formatWeightDelta(snapshot.delta, system)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      Waist context:
                    </span>{" "}
                    {waistToHeightMessage(snapshot.waistRatio)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      Target preview:
                    </span>{" "}
                    {Number.isFinite(snapshot.targetBmi)
                      ? `BMI ${round1(snapshot.targetBmi)}${snapshot.targetCategory ? ` · ${CATEGORY_LABEL[snapshot.targetCategory]}` : ""}`
                      : "Not set"}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      Method:
                    </span>{" "}
                    weight ÷ height²; waist ÷ height.
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] text-center text-sm text-[var(--color-text-tertiary)]">
                Enter positive weight and height measurements to calculate a
                result.
              </div>
            )}
          </div>
        </section>
      }
      actionsSlot={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={summaryText}
              size="sm"
              variant="secondary"
              disabled={!valid}
            >
              Copy summary
            </CopyButton>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
              disabled={!valid}
            >
              Print
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={downloadProjectJson}
              leftIcon={<FileJson className="h-4 w-4" />}
              disabled={!valid}
            >
              JSON
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={downloadMarkdown}
              leftIcon={<FileText className="h-4 w-4" />}
              disabled={!valid}
            >
              Markdown
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={downloadSnapshotCsv}
              leftIcon={<Download className="h-4 w-4" />}
              disabled={!valid}
            >
              CSV
            </Button>
            <Button
              size="sm"
              onClick={() => void downloadProductionPack()}
              loading={packing}
              leftIcon={<Archive className="h-4 w-4" />}
              disabled={!valid}
            >
              ZIP pack
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applyConfig(DEFAULT_BMI_CONFIG)}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset measurements
          </Button>
        </div>
      }
      optionsSlot={
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-5 w-5 text-[var(--color-primary-text-strong)]"
              aria-hidden
            />
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">
              Applicability and production checks
            </h3>
          </div>
          <WarningPanel messages={auditChecks.map(auditToWarning)} />
        </div>
      }
      statsSlot={
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]">
                <History className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                  Local history
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Saved only in this browser.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={saveResult}
                disabled={!valid}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadTextFile({
                    filename: "bmi-history.csv",
                    content: historyToCsv(history),
                    mimeType: "text/csv;charset=utf-8",
                  })
                }
                disabled={!history.length}
                leftIcon={<Download className="h-4 w-4" />}
              >
                History CSV
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={clearHistory}
                disabled={!history.length}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Clear
              </Button>
            </div>
          </div>
          {latestComparison ? (
            <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              {latestComparison}
            </p>
          ) : null}
          <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
            {!history.length ? (
              <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] p-4 text-center text-xs text-[var(--color-text-tertiary)]">
                No saved results yet.
              </p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-[var(--color-text-primary)]">
                      BMI {round1(entry.bmi)} · {CATEGORY_LABEL[entry.category]}
                    </div>
                    <div className="text-[var(--color-text-tertiary)]">
                      {new Date(entry.createdAt).toLocaleString()} ·{" "}
                      {entry.weight} {entry.weightUnit}
                    </div>
                  </div>
                  <Activity
                    className="h-4 w-4 text-[var(--color-text-tertiary)]"
                    aria-hidden
                  />
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-xs leading-5 text-[var(--color-info-text)]">
            <Target className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{BMI_DISCLAIMER}</span>
          </div>
        </div>
      }
    />
  );
}
