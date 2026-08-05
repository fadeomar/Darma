"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileJson, Info, Package, Sparkles, Upload, XCircle } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import type { AnimatedBackgroundState } from "@/types/animatedBackgroundTypes";
import {
  ANIMATED_BACKGROUND_IMPORT_MAX_BYTES,
  buildAnimatedBackgroundMarkdownReport,
  buildAnimatedBackgroundMetricsCsv,
  buildAnimatedBackgroundProductionFiles,
  createAnimatedBackgroundProject,
  parseAnimatedBackgroundProject,
  summarizeAnimatedBackgroundAudit,
  type AnimatedBackgroundAuditCheck,
  type AnimatedBackgroundAuditSeverity,
  type AnimatedBackgroundFixId,
} from "../lib/studio";
import { createAnimatedBackgroundZip } from "../lib/zip";

interface ProductionPanelProps {
  state: AnimatedBackgroundState;
  css: string;
  html: string;
  checks: AnimatedBackgroundAuditCheck[];
  onImport: (state: AnimatedBackgroundState) => void;
  onUpdate: (patch: Partial<AnimatedBackgroundState>) => void;
}

const CHECK_STYLES: Record<AnimatedBackgroundAuditSeverity, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
};

function CheckIcon({ severity }: { severity: AnimatedBackgroundAuditSeverity }) {
  if (severity === "error") return <XCircle className="h-4 w-4 shrink-0" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />;
  if (severity === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />;
  return <Info className="h-4 w-4 shrink-0" aria-hidden />;
}

function CheckCard({ check, onFix }: { check: AnimatedBackgroundAuditCheck; onFix?: () => void }) {
  return (
    <div className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.severity]}`}>
      <div className="flex items-start gap-2">
        <CheckIcon severity={check.severity} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black">{check.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p>
          {onFix ? (
            <button
              type="button"
              onClick={onFix}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-current/25 px-2.5 py-1.5 text-xs font-black transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Apply suggested fix
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const FIX_LABELS: Record<AnimatedBackgroundFixId, string> = {
  "normalize-size-range": "Normalized the particle size range.",
  "reduce-density": "Reduced particle density to a mobile-friendlier level.",
  "reduce-large-blur": "Reduced oversized blurred layers.",
  "reduce-glow": "Reduced glow intensity.",
  "reduce-render-cost": "Applied a balanced render-cost configuration.",
  "reduce-motion": "Reduced motion intensity.",
  "enable-content-preview": "Enabled the hero readability preview.",
  "enable-readability-protection": "Enabled automatic foreground and readability protection.",
  "use-auto-foreground": "Switched to automatic foreground selection and protection.",
};

function fixPatch(fixId: AnimatedBackgroundFixId, state: AnimatedBackgroundState): Partial<AnimatedBackgroundState> {
  switch (fixId) {
    case "normalize-size-range":
      return { maxSize: Math.min(720, Math.max(state.minSize + 4, state.minSize + 120)) };
    case "reduce-density":
      return { particleCount: Math.min(state.particleCount, 24) };
    case "reduce-large-blur":
      return { maxSize: Math.min(state.maxSize, 560), blur: Math.min(state.blur, 72) };
    case "reduce-glow":
      return { glow: Math.min(state.glow, 64) };
    case "reduce-render-cost":
      return {
        particleCount: Math.min(state.particleCount, 24),
        blur: Math.min(state.blur, 48),
        glow: Math.min(state.glow, 48),
        maxSize: Math.min(state.maxSize, 520),
        blendMode: state.blendMode === "plus-lighter" ? "screen" : state.blendMode,
      };
    case "reduce-motion":
      return { speed: Math.min(state.speed, 0.75), intensity: Math.min(state.intensity, 0.6), particleCount: Math.min(state.particleCount, 24) };
    case "enable-content-preview":
      return { showContent: true, previewMode: "hero" };
    case "enable-readability-protection":
    case "use-auto-foreground":
      return { foregroundMode: "auto", readabilityProtection: true };
    default:
      return {};
  }
}

export default function ProductionPanel({ state, css, html, checks, onImport, onUpdate }: ProductionPanelProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isPacking, setIsPacking] = useState(false);
  const counts = summarizeAnimatedBackgroundAudit(checks);
  const blocked = counts.error > 0;
  const actionChecks = checks.filter((check) => check.severity === "error" || check.severity === "warning");
  const informationChecks = checks.filter((check) => check.severity === "info");
  const passedChecks = checks.filter((check) => check.severity === "pass");

  async function handleImport(file: File | undefined) {
    if (!file) return;
    if (file.size > ANIMATED_BACKGROUND_IMPORT_MAX_BYTES) {
      setMessage("Import failed: project files must be 1 MB or smaller.");
      if (importRef.current) importRef.current.value = "";
      return;
    }

    try {
      const project = parseAnimatedBackgroundProject(await file.text());
      onImport(project.state);
      setMessage(`Imported ${file.name}. Review quality checks before exporting.`);
    } catch (error) {
      setMessage(`Import failed: ${error instanceof Error ? error.message : "Unknown project format."}`);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  function applyFix(fixId: AnimatedBackgroundFixId) {
    onUpdate(fixPatch(fixId, state));
    setMessage(FIX_LABELS[fixId]);
  }

  async function downloadPack() {
    if (blocked || isPacking) return;
    setIsPacking(true);
    try {
      const files = buildAnimatedBackgroundProductionFiles(state, css, html, checks);
      const blob = await createAnimatedBackgroundZip(
        Object.entries(files).map(([filename, content]) => ({ filename, content })),
      );
      downloadBlobFile({ blob, filename: "darma-animated-background-production-pack.zip" });
    } finally {
      setIsPacking(false);
    }
  }

  return (
    <section id="animated-background-production" tabIndex={-1} className="scroll-mt-24 space-y-5 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-card)] sm:p-5" aria-labelledby="animated-background-production-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Export and quality checks</Badge>
            <Badge variant={blocked ? "danger" : counts.warning ? "warning" : "success"}>
              {blocked ? "Blocked" : counts.warning ? "Review" : "Ready"}
            </Badge>
          </div>
          <h2 id="animated-background-production-heading" className="mt-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Prepare the production package</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Resolve blocking issues, review warnings, and download a complete HTML, CSS, React, token, report, and metrics package.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void handleImport(event.target.files?.[0])} />
          <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => importRef.current?.click()}>Import project</Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileJson className="h-4 w-4" aria-hidden />}
            onClick={() => downloadTextFile({ content: JSON.stringify(createAnimatedBackgroundProject(state), null, 2), filename: "animated-background-project.json", mimeType: "application/json;charset=utf-8" })}
          >
            Save project JSON
          </Button>
          <Button size="sm" variant="primary" disabled={blocked || isPacking} leftIcon={<Package className="h-4 w-4" aria-hidden />} onClick={() => void downloadPack()}>
            {isPacking ? "Packing…" : "Download production ZIP"}
          </Button>
        </div>
      </div>

      {message ? <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs leading-5 text-[var(--color-text-secondary)]" role="status">{message}</p> : null}

      {actionChecks.length ? (
        <section className="space-y-2" aria-labelledby="animated-background-action-checks">
          <div className="flex items-center justify-between gap-3">
            <h3 id="animated-background-action-checks" className="text-sm font-black text-[var(--color-text-primary)]">Needs attention</h3>
            <Badge variant={blocked ? "danger" : "warning"}>{actionChecks.length} item{actionChecks.length === 1 ? "" : "s"}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {actionChecks.map((check) => <CheckCard key={check.id} check={check} onFix={check.fixId ? () => applyFix(check.fixId!) : undefined} />)}
          </div>
        </section>
      ) : (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-black">No blocking issues or warnings</p>
            <p className="mt-1 text-xs leading-5">The production package is ready for final device and content review.</p>
          </div>
        </div>
      )}

      {informationChecks.length ? (
        <section className="space-y-2" aria-labelledby="animated-background-information-checks">
          <h3 id="animated-background-information-checks" className="text-sm font-black text-[var(--color-text-primary)]">Verification notes</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {informationChecks.map((check) => <CheckCard key={check.id} check={check} onFix={check.fixId ? () => applyFix(check.fixId!) : undefined} />)}
          </div>
        </section>
      ) : null}

      {passedChecks.length ? (
        <details className="group rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
            <span>{passedChecks.length} passed check{passedChecks.length === 1 ? "" : "s"}</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="grid gap-2 border-t border-[var(--color-border-subtle)] p-3 sm:grid-cols-2">
            {passedChecks.map((check) => <CheckCard key={check.id} check={check} />)}
          </div>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] pt-4">
        <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildAnimatedBackgroundMarkdownReport(state, css, html, checks), filename: "animated-background-production-report.md", mimeType: "text/markdown;charset=utf-8" })}>Download report</Button>
        <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildAnimatedBackgroundMetricsCsv(state, css, html, checks), filename: "animated-background-production-metrics.csv", mimeType: "text/csv;charset=utf-8" })}>Download metrics CSV</Button>
      </div>
    </section>
  );
}
