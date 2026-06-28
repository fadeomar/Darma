"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, FolderOpen, RotateCcw, Shapes, Share2 } from "lucide-react";
import { Button, CopyButton } from "@/components/ui";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { analyzeBeam } from "./lib/beamAnalysis";
import { validateBeam } from "./lib/beamValidation";
import {
  UNIT_SYSTEMS,
  type BeamLoad,
  type BeamModel,
  type SelectedItem,
  type Support,
  type SupportType,
} from "./lib/beamTypes";
import { deriveBeamMode, isGuidedMode, supportsForMode, type BeamMode } from "./lib/beamMode";
import {
  BEAM_PRESETS,
  DEFAULT_PRESET_ID,
  clonePresetModel,
  getPreset,
  type BeamPreset,
} from "./lib/beamPresets";
import {
  buildClipboardSummary,
  buildReport,
  parseConfig,
  serializeConfig,
  serializeResultsJson,
} from "./lib/beamExport";
import { roundTo } from "./lib/beamFormatting";
import { BeamInputs } from "./components/BeamInputs";
import { BeamCanvas } from "./components/BeamCanvas";
import { BeamDiagram } from "./components/BeamDiagram";
import { BeamResults } from "./components/BeamResults";
import { BeamPresetCards } from "./components/BeamPresetCards";
import { BeamHowTo } from "./components/BeamHowTo";

const STORAGE_KEY = "darma-beam-calculator:v2";

type LoadKind = "point" | "udl" | "moment";

function defaultModel(): BeamModel {
  return clonePresetModel(getPreset(DEFAULT_PRESET_ID)!);
}

function nextSupportId(supports: Support[]): string {
  const used = new Set(supports.map((s) => s.id));
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (!used.has(letter)) return letter;
  let i = 1;
  while (used.has(`S${i}`)) i += 1;
  return `S${i}`;
}

function nextLoadId(loads: BeamLoad[], prefix: string): string {
  const used = new Set(loads.map((l) => l.id));
  let i = 1;
  while (used.has(`${prefix}${i}`)) i += 1;
  return `${prefix}${i}`;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BeamCalculatorClient() {
  const [model, setModel] = useState<BeamModel>(defaultModel);
  const [beamMode, setBeamMode] = useState<BeamMode>(() => deriveBeamMode(defaultModel()));
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | undefined>(DEFAULT_PRESET_ID);
  const [notice, setNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore last setup from localStorage on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseConfig(stored);
        if (parsed) {
          setModel(parsed);
          setBeamMode(deriveBeamMode(parsed));
          setActivePresetId(undefined);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Auto-save latest setup.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeConfig(model));
    } catch {
      // storage may be unavailable (private mode, quota) — non-fatal
    }
  }, [model, hydrated]);

  // Transient notice auto-dismiss.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const units = UNIT_SYSTEMS[model.unitSystem];
  const validation = useMemo(() => validateBeam(model), [model]);
  const result = useMemo(() => (validation.ok ? analyzeBeam(model) : null), [model, validation.ok]);

  const fieldErrors = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of validation.errors) {
      if (issue.target?.id && !map.has(issue.target.id)) map.set(issue.target.id, issue.message);
    }
    return map;
  }, [validation.errors]);

  const beamLengthError = useMemo(() => validation.errors.find((e) => e.id === "beam-length")?.message, [validation.errors]);

  // ---- Mutators ----
  const markCustom = useCallback(() => setActivePresetId(undefined), []);

  const updateLength = useCallback(
    (length: number) => {
      setModel((prev) => {
        const L = roundTo(Math.max(0.1, length), 4);
        // Guided modes keep their supports pinned to the beam ends.
        const supports = isGuidedMode(beamMode) ? supportsForMode(beamMode, L) : prev.supports;
        return { ...prev, length: L, supports };
      });
      markCustom();
    },
    [markCustom, beamMode],
  );

  const changeMode = useCallback(
    (mode: BeamMode) => {
      setBeamMode(mode);
      setSelected(null);
      if (mode !== "advanced") {
        setModel((prev) => ({ ...prev, supports: supportsForMode(mode, prev.length) }));
        markCustom();
        setNotice(`Beam type: ${mode.replace("-", " ")}`);
      }
    },
    [markCustom],
  );

  const updateSupport = useCallback(
    (id: string, patch: Partial<Support>) => {
      setModel((prev) => ({ ...prev, supports: prev.supports.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
      markCustom();
    },
    [markCustom],
  );

  const removeSupport = useCallback(
    (id: string) => {
      setModel((prev) => ({ ...prev, supports: prev.supports.filter((s) => s.id !== id) }));
      markCustom();
    },
    [markCustom],
  );

  const addSupport = useCallback(
    (type: SupportType) => {
      setModel((prev) => ({
        ...prev,
        supports: [...prev.supports, { id: nextSupportId(prev.supports), type, x: roundTo(prev.length / 2, 2) }],
      }));
      markCustom();
    },
    [markCustom],
  );

  const updateLoad = useCallback(
    (id: string, patch: Partial<BeamLoad>) => {
      setModel((prev) => ({ ...prev, loads: prev.loads.map((l) => (l.id === id ? ({ ...l, ...patch } as BeamLoad) : l)) }));
      markCustom();
    },
    [markCustom],
  );

  const removeLoad = useCallback(
    (id: string) => {
      setModel((prev) => ({ ...prev, loads: prev.loads.filter((l) => l.id !== id) }));
      setSelected((sel) => (sel && sel.id === id ? null : sel));
      markCustom();
    },
    [markCustom],
  );

  const addLoad = useCallback(
    (kind: LoadKind) => {
      let newId = "";
      setModel((prev) => {
        let load: BeamLoad;
        if (kind === "point") {
          newId = nextLoadId(prev.loads, "P");
          load = { id: newId, kind: "point", x: roundTo(prev.length / 2, 2), magnitude: 10, direction: "down" };
        } else if (kind === "udl") {
          newId = nextLoadId(prev.loads, "W");
          load = { id: newId, kind: "udl", start: 0, end: prev.length, magnitude: 5, direction: "down" };
        } else {
          newId = nextLoadId(prev.loads, "M");
          load = { id: newId, kind: "moment", x: roundTo(prev.length / 2, 2), magnitude: 10, rotation: "ccw" };
        }
        return { ...prev, loads: [...prev.loads, load] };
      });
      if (newId) setSelected(kind === "udl" ? { kind: "udl-body", id: newId } : { kind, id: newId });
      markCustom();
    },
    [markCustom],
  );

  const loadModel = useCallback((next: BeamModel, presetId?: string) => {
    setModel(next);
    setBeamMode(deriveBeamMode(next));
    setSelected(null);
    setActivePresetId(presetId);
  }, []);

  const applyPreset = useCallback(
    (preset: BeamPreset) => {
      loadModel(clonePresetModel(preset), preset.id);
      setNotice(`Loaded preset: ${preset.name}`);
    },
    [loadModel],
  );

  const reset = useCallback(() => {
    const preset = getPreset(DEFAULT_PRESET_ID)!;
    loadModel(clonePresetModel(preset), preset.id);
    setNotice("Reset to default beam");
  }, [loadModel]);

  const loadExample = useCallback(() => {
    const examples = BEAM_PRESETS.filter((p) => p.id !== "custom-blank" && p.id !== activePresetId);
    const pick = examples[Math.floor(Math.random() * examples.length)] ?? BEAM_PRESETS[1];
    applyPreset(pick);
  }, [activePresetId, applyPreset]);

  const handleImportClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleImportFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseConfig(String(reader.result ?? ""));
        if (parsed) {
          loadModel(parsed, undefined);
          setNotice("Imported beam configuration");
        } else {
          setNotice("Could not read that file as a beam configuration");
        }
      };
      reader.readAsText(file);
    },
    [loadModel],
  );

  // ---- One-click fixes for common validation errors ----
  const quickFixes = useCallback(
    (issueId: string, targetId?: string): { label: string; run: () => void }[] => {
      if (issueId === "support-config") {
        return [
          { label: "Use simply supported", run: () => changeMode("simply-supported") },
          { label: "Use cantilever", run: () => changeMode("cantilever-left") },
        ];
      }
      if (issueId === "support-duplicate") {
        return [{ label: "Spread supports", run: () => changeMode("simply-supported") }];
      }
      if (targetId && issueId.includes("-x-range")) {
        return [
          { label: "Move to end", run: () => updateLoad(targetId, { x: model.length }) },
          { label: "Move to center", run: () => updateLoad(targetId, { x: roundTo(model.length / 2, 2) }) },
        ];
      }
      if (targetId && issueId.includes("-range-order")) {
        return [
          { label: "Swap start/end", run: () => {
            const load = model.loads.find((l) => l.id === targetId);
            if (load && load.kind === "udl") updateLoad(targetId, { start: Math.min(load.start, load.end), end: Math.max(load.start, load.end) });
          } },
          { label: "Use full span", run: () => updateLoad(targetId, { start: 0, end: model.length }) },
        ];
      }
      if (targetId && issueId.includes("-range-bounds")) {
        return [{ label: "Use full span", run: () => updateLoad(targetId, { start: 0, end: model.length }) }];
      }
      if (targetId && issueId.startsWith("support-") && issueId.includes("-x-range")) {
        return [{ label: "Move to end", run: () => updateSupport(targetId, { x: model.length }) }];
      }
      return [];
    },
    [changeMode, updateLoad, updateSupport, model.length, model.loads],
  );

  const resultsText = result ? buildClipboardSummary(model, result) : "";
  const configText = useMemo(() => serializeConfig(model), [model]);

  const warningMessages: WarningMessage[] = useMemo(() => {
    const renderActions = (fixes: { label: string; run: () => void }[]) =>
      fixes.length ? (
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {fixes.map((fix) => (
            <button
              key={fix.label}
              type="button"
              onClick={fix.run}
              className="rounded-[var(--radius-sm)] border border-current bg-[var(--color-surface-base)]/40 px-2 py-0.5 text-[11px] font-bold transition hover:bg-[var(--color-surface-base)]/70"
            >
              {fix.label}
            </button>
          ))}
        </span>
      ) : null;

    const messages: WarningMessage[] = [];
    for (const issue of validation.errors) {
      const fixes = quickFixes(issue.id, issue.target?.id);
      messages.push({
        id: issue.id,
        severity: "danger",
        title: "Fix to calculate",
        message: (
          <span>
            {issue.message}
            {renderActions(fixes)}
          </span>
        ),
      });
    }
    for (const issue of validation.warnings) {
      messages.push({ id: issue.id, severity: "warning", message: issue.message });
    }
    return messages;
  }, [validation, quickFixes]);

  const suggestionPresetId = validation.errors.find((e) => e.suggestionPresetId)?.suggestionPresetId;
  const noResultsHint = result ? undefined : "Fix the highlighted issues to enable export";

  return (
    <div className="space-y-5">
      <BeamHowTo />

      {/* Disclaimer */}
      <WarningPanel
        messages={[
          {
            id: "disclaimer",
            severity: "info",
            title: "Educational & preliminary only",
            message:
              "This tool is for educational and preliminary analysis only. Always consult a qualified structural engineer for real-world design or safety-critical decisions. Sign convention: downward loads negative, upward reactions positive, sagging moment positive, hogging negative.",
          },
        ]}
      />

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" leftIcon={<Shapes className="h-4 w-4" />} onClick={loadExample}>
          Load example
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
          Reset
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-[var(--color-border-default)] sm:block" />
        <CopyButton variant="secondary" size="sm" text={resultsText} disabled={!result} title={noResultsHint}>
          Copy results
        </CopyButton>
        <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} disabled={!result} title={noResultsHint} onClick={() => result && download("beam-results.json", serializeResultsJson(model, result), "application/json")}>
          JSON
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<FileText className="h-4 w-4" />} disabled={!result} title={noResultsHint} onClick={() => result && download("beam-report.md", buildReport(model, result), "text/markdown")}>
          Report
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-[var(--color-border-default)] sm:block" />
        <CopyButton variant="ghost" size="sm" text={configText} copiedLabel="Copied config">
          Copy config
        </CopyButton>
        <Button variant="ghost" size="sm" leftIcon={<FolderOpen className="h-4 w-4" />} onClick={handleImportClick}>
          Import
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" aria-hidden tabIndex={-1} />
        {notice ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-success-text)]" role="status">
            <Share2 className="h-3.5 w-3.5" /> {notice}
          </span>
        ) : null}
      </div>

      {/* Workspace */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        {/* Left: inputs + presets */}
        <div className="space-y-5">
          <BeamInputs
            model={model}
            units={units}
            mode={beamMode}
            fieldErrors={fieldErrors}
            beamLengthError={beamLengthError}
            selected={selected}
            onSelect={setSelected}
            onModeChange={changeMode}
            onLengthChange={updateLength}
            onSupportUpdate={updateSupport}
            onSupportRemove={removeSupport}
            onSupportAdd={addSupport}
            onLoadUpdate={updateLoad}
            onLoadRemove={removeLoad}
            onLoadAdd={addLoad}
          />
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="mb-1 text-sm font-bold text-[var(--color-text-primary)]">Presets</h2>
            <p className="mb-3 text-xs text-[var(--color-text-tertiary)]">Start from a valid scenario, then tweak it.</p>
            <BeamPresetCards activeId={activePresetId} onSelect={applyPreset} />
          </section>
        </div>

        {/* Right: preview + diagrams + results (sticky on desktop) */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Beam preview</h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">Drag the orange handles, or select an item and click the beam to place it.</p>
            </div>
            <BeamCanvas
              model={model}
              result={result}
              units={units}
              selected={selected}
              onSelect={setSelected}
              onSupportPosition={(id, x) => updateSupport(id, { x })}
              onLoadPosition={updateLoad}
              supportsDraggable={beamMode === "advanced"}
            />
          </section>

          {warningMessages.length > 0 ? <WarningPanel messages={warningMessages} /> : null}

          {result ? (
            <>
              <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)] sm:grid-cols-2">
                <BeamDiagram
                  title="Shear force diagram (SFD)"
                  description={`Shear force along the beam in ${units.force}. Positive plotted above the zero line.`}
                  samples={result.samples}
                  metric="shear"
                  length={model.length}
                  lengthUnit={units.length}
                  valueUnit={units.force}
                  extreme={result.maxShear}
                />
                <BeamDiagram
                  title="Bending moment diagram (BMD)"
                  description={`Bending moment along the beam in ${units.moment}. Positive (sagging) plotted above the zero line.`}
                  samples={result.samples}
                  metric="moment"
                  length={model.length}
                  lengthUnit={units.length}
                  valueUnit={units.moment}
                  extreme={result.maxAbsMoment}
                  secondaryExtreme={result.maxPositiveMoment.value > 1e-9 && result.maxNegativeMoment.value < -1e-9 ? result.maxPositiveMoment : undefined}
                />
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-sm)]">
                <BeamResults model={model} result={result} units={units} />
              </section>
            </>
          ) : (
            <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-8 text-center">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">No results yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">The current configuration can&apos;t be solved. Use a one-click fix above, or start from a working preset.</p>
              {suggestionPresetId ? (
                <Button
                  className="mt-4"
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    const preset = getPreset(suggestionPresetId);
                    if (preset) applyPreset(preset);
                  }}
                >
                  Load a suggested preset
                </Button>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
