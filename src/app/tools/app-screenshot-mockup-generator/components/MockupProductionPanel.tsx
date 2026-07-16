"use client";

import { useRef } from "react";
import { Download, FileJson, FileText, RotateCcw, ShieldCheck, Table2, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GeneratedMockupAsset, MockupInput } from "../types";
import { createMockupProductionChecks, summarizeMockupProduction } from "../studio";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MockupProductionPanel({
  input,
  assets,
  generatedFingerprint,
  message,
  onExportProject,
  onImportProject,
  onExportReport,
  onExportCsv,
  onReset,
}: {
  input: MockupInput;
  assets: GeneratedMockupAsset[];
  generatedFingerprint?: string;
  message: string;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  onExportReport: () => void;
  onExportCsv: () => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const summary = summarizeMockupProduction(input, assets, generatedFingerprint);
  const checks = createMockupProductionChecks(input, assets, generatedFingerprint);
  const cards = [
    { label: "Source", value: summary.source, detail: input.screenshotName || "Local image required" },
    { label: "Export pack", value: summary.pack, detail: `${assets.length || 0} generated files` },
    { label: "Payload", value: formatBytes(summary.assetBytes), detail: summary.isFresh ? "Matches current design" : assets.length ? "Regeneration required" : "No generated pack" },
    { label: "Readiness", value: `${summary.score}/100`, detail: summary.statusLabel },
  ];

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
            Project and production audit
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--color-text-secondary)]">
            Save reopenable settings without embedding uploaded images, inspect package freshness, and export audit evidence for handoff.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" leftIcon={<FileJson className="h-4 w-4" />} onClick={onExportProject}>Project JSON</Button>
          <Button size="sm" variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>Import</Button>
          <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>Reset</Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImportProject(file);
          event.target.value = "";
        }}
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{card.label}</div>
            <div className="mt-1 truncate text-base font-black text-[var(--color-text-primary)]" title={card.value}>{card.value}</div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]" title={card.detail}>{card.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={cn(
              "rounded-[var(--radius-md)] border p-3",
              check.severity === "error" && "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]",
              check.severity === "warning" && "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]",
              check.severity === "info" && "border-[var(--color-info-border)] bg-[var(--color-info-bg)]",
              check.severity === "pass" && "border-[var(--color-success-border)] bg-[var(--color-success-bg)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[var(--color-text-primary)]">{check.title}</span>
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{check.severity}</span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-secondary)]">{check.message}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-3">
        <p className="max-w-2xl text-[11px] leading-5 text-[var(--color-text-tertiary)]">
          Project imports are capped at 1 MB. Screenshot and background-image bytes are intentionally excluded and must be reattached locally.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" leftIcon={<FileText className="h-4 w-4" />} onClick={onExportReport}>Markdown</Button>
          <Button size="sm" variant="ghost" leftIcon={<Table2 className="h-4 w-4" />} onClick={onExportCsv}>CSV</Button>
          <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" />} onClick={onExportProject}>Download project</Button>
        </div>
      </div>
      {message ? <p role="status" className="text-xs font-semibold text-[var(--color-text-secondary)]">{message}</p> : null}
    </section>
  );
}
