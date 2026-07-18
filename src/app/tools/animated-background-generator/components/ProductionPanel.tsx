"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, Info, Package, Upload, XCircle } from "lucide-react";
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
} from "../lib/studio";
import { createAnimatedBackgroundZip } from "../lib/zip";

interface ProductionPanelProps {
  state: AnimatedBackgroundState;
  css: string;
  html: string;
  checks: AnimatedBackgroundAuditCheck[];
  onImport: (state: AnimatedBackgroundState) => void;
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

export default function ProductionPanel({ state, css, html, checks, onImport }: ProductionPanelProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isPacking, setIsPacking] = useState(false);
  const counts = summarizeAnimatedBackgroundAudit(checks);
  const blocked = counts.error > 0;

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
      setMessage(`Imported ${file.name}. Review production checks before exporting.`);
    } catch (error) {
      setMessage(`Import failed: ${error instanceof Error ? error.message : "Unknown project format."}`);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
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
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-card)]" aria-labelledby="animated-background-production-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Production handoff</Badge>
            <Badge variant={blocked ? "danger" : counts.warning ? "warning" : "success"}>
              {blocked ? "Blocked" : counts.warning ? "Review" : "Ready"}
            </Badge>
          </div>
          <h2 id="animated-background-production-heading" className="mt-2 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Project, audit, and deployment pack</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Save a reopenable project, review motion and paint-cost warnings, then export a complete HTML, CSS, React, tokens, report, and metrics package.</p>
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
            Project JSON
          </Button>
          <Button size="sm" variant="primary" disabled={blocked || isPacking} leftIcon={<Package className="h-4 w-4" aria-hidden />} onClick={() => void downloadPack()}>
            {isPacking ? "Packing…" : "Production ZIP"}
          </Button>
        </div>
      </div>

      {message ? <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs leading-5 text-[var(--color-text-secondary)]" role="status">{message}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2" aria-label="Animated background production checks">
        {checks.map((check) => (
          <div key={check.id} className={`rounded-[var(--radius-md)] border p-3 ${CHECK_STYLES[check.severity]}`}>
            <div className="flex items-start gap-2">
              <CheckIcon severity={check.severity} />
              <div className="min-w-0">
                <p className="text-xs font-black">{check.title}</p>
                <p className="mt-1 text-xs leading-5 opacity-90">{check.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] pt-4">
        <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildAnimatedBackgroundMarkdownReport(state, css, html, checks), filename: "animated-background-production-report.md", mimeType: "text/markdown;charset=utf-8" })}>Markdown report</Button>
        <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildAnimatedBackgroundMetricsCsv(state, css, html, checks), filename: "animated-background-production-metrics.csv", mimeType: "text/csv;charset=utf-8" })}>Metrics CSV</Button>
      </div>
    </section>
  );
}
