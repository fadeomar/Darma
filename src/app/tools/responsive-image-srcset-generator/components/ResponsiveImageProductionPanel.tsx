"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { AlertTriangle, CheckCircle2, Download, FileJson, Info, Package, Upload, XCircle } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { downloadTextFile } from "@/features/tools/export/downloadText";
import type { ResponsiveImageState } from "../types";
import {
  RESPONSIVE_IMAGE_IMPORT_MAX_BYTES,
  buildResponsiveImageAudit,
  buildResponsiveImageMarkdownReport,
  buildResponsiveImageMetricsCsv,
  buildResponsiveImageProductionFiles,
  buildResponsiveImageSummary,
  createResponsiveImageProject,
  parseResponsiveImageProject,
  summarizeResponsiveImageAudit,
  type ResponsiveImageAuditCheck,
  type ResponsiveImageAuditSeverity,
} from "../studio";

const CHECK_STYLES: Record<ResponsiveImageAuditSeverity, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
};

function CheckIcon({ severity }: { severity: ResponsiveImageAuditSeverity }) {
  if (severity === "error") return <XCircle className="h-4 w-4 shrink-0" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />;
  if (severity === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />;
  return <Info className="h-4 w-4 shrink-0" aria-hidden />;
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2.5 shadow-[var(--shadow-xs)]">
      <div className="truncate font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</div>
      <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">{detail}</div>
    </div>
  );
}

export function ResponsiveImageProductionPanel({
  state,
  checks = buildResponsiveImageAudit(state),
  onImport,
}: {
  state: ResponsiveImageState;
  checks?: ResponsiveImageAuditCheck[];
  onImport: (state: ResponsiveImageState) => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isPacking, setIsPacking] = useState(false);
  const counts = summarizeResponsiveImageAudit(checks);
  const summary = buildResponsiveImageSummary(state, checks);
  const blocked = counts.error > 0;

  async function handleImport(file: File | undefined) {
    if (!file) return;
    if (file.size > RESPONSIVE_IMAGE_IMPORT_MAX_BYTES) {
      setMessage("Import failed: project files must be 1 MB or smaller.");
      if (importRef.current) importRef.current.value = "";
      return;
    }
    try {
      const project = parseResponsiveImageProject(await file.text());
      onImport(project.state);
      setMessage(`Imported ${file.name}. Review the candidate plan and production checks.`);
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
      const zip = new JSZip();
      const files = buildResponsiveImageProductionFiles(state, checks);
      Object.entries(files).forEach(([filename, content]) => zip.file(filename, content));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: "darma-responsive-image-production-pack.zip" });
    } finally {
      setIsPacking(false);
    }
  }

  const statusLabel = blocked ? "Blocked" : counts.warning ? "Review" : "Ready";

  return (
    <details className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)]" aria-labelledby="responsive-image-production-heading">
      <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Developer handoff & QA</Badge>
              <Badge variant={blocked ? "danger" : counts.warning ? "warning" : "success"}>{statusLabel}</Badge>
            </div>
            <p className="mt-2 text-sm font-black text-[var(--color-text-primary)]">Production pack, audit, and project backup</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">Open only when you need readiness checks, reports, metrics, project import/export, or the full delivery ZIP.</p>
          </div>
          <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{counts.error} errors · {counts.warning} warnings</span>
        </div>
      </summary>

      <div className="space-y-4 border-t border-[var(--color-border-subtle)] p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((card) => <SummaryCard key={card.label} {...card} />)}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <div>
            <h2 id="responsive-image-production-heading" className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">Production delivery</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Save a reopenable candidate plan or export standalone HTML, CSS, Next.js, reports, and metrics.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void handleImport(event.target.files?.[0])} />
            <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => importRef.current?.click()}>Import project</Button>
            <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: `${JSON.stringify(createResponsiveImageProject(state), null, 2)}\n`, filename: "responsive-image-project.json", mimeType: "application/json;charset=utf-8" })}>Project JSON</Button>
            <Button size="sm" variant="primary" disabled={blocked || isPacking} leftIcon={<Package className="h-4 w-4" aria-hidden />} onClick={() => void downloadPack()}>{isPacking ? "Packing…" : "Production ZIP"}</Button>
          </div>
        </div>

        {message ? <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs leading-5 text-[var(--color-text-secondary)]" role="status">{message}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2" aria-label="Responsive image production checks">
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
          <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildResponsiveImageMarkdownReport(state, checks), filename: "responsive-image-production-report.md", mimeType: "text/markdown;charset=utf-8" })}>Markdown report</Button>
          <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadTextFile({ content: buildResponsiveImageMetricsCsv(state, checks), filename: "responsive-image-production-metrics.csv", mimeType: "text/csv;charset=utf-8" })}>Metrics CSV</Button>
        </div>
      </div>
    </details>
  );
}
