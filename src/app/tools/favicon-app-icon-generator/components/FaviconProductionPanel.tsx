"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { FileJson, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { ControlSection, WarningPanel, type WarningMessage } from "@/features/tools/components";
import type { FaviconInput, GeneratedAsset } from "../types";
import {
  MAX_FAVICON_PROJECT_BYTES,
  createFaviconProductionChecks,
  formatBytes,
  summarizeFaviconProduction,
} from "../studio";

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{children}</span>;
}

function mapChecks(input: FaviconInput, assets: GeneratedAsset[], generatedFingerprint?: string): WarningMessage[] {
  return createFaviconProductionChecks(input, assets, generatedFingerprint).map((check) => ({
    id: check.id,
    severity: check.severity === "error" ? "danger" : check.severity === "pass" ? "success" : check.severity,
    title: check.title,
    message: check.message,
  }));
}

export function FaviconProjectControls({
  message,
  onExport,
  onImport,
  onReset,
}: {
  message: string;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <ControlSection title="Project backup" description="Save or reopen versioned settings without embedding uploaded image data.">
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="secondary" size="sm" leftIcon={<FileJson className="h-4 w-4" />} onClick={onExport}>
          Export project
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
          Import project
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>
          Reset settings
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
      <p className="text-[11px] leading-5 text-[var(--color-text-tertiary)]">
        Project imports are capped at {Math.round(MAX_FAVICON_PROJECT_BYTES / 1024 / 1024)} MB. Uploaded images are excluded; safe SVG markup is included only below 256 KB.
      </p>
      {message ? <p role="status" className="text-xs font-medium text-[var(--color-text-secondary)]">{message}</p> : null}
    </ControlSection>
  );
}

export function FaviconProductionSummary({
  input,
  assets,
  generatedFingerprint,
}: {
  input: FaviconInput;
  assets: GeneratedAsset[];
  generatedFingerprint?: string;
}) {
  const summary = useMemo(() => summarizeFaviconProduction(input, assets, generatedFingerprint), [assets, generatedFingerprint, input]);
  const cards = [
    { label: "Source", value: summary.sourceLabel, detail: input.shape },
    { label: "Target", value: summary.targetLabel, detail: summary.packLabel },
    { label: "Files", value: String(summary.assetCount), detail: formatBytes(summary.assetBytes) },
    { label: "Readiness", value: summary.statusLabel, detail: `${summary.readinessScore}/100 · ${summary.fresh ? "current" : "regenerating"}` },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 shadow-[var(--shadow-xs)]">
          <MiniLabel>{card.label}</MiniLabel>
          <div className="mt-1 truncate text-base font-black text-[var(--color-text-primary)]" title={card.value}>{card.value}</div>
          <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">{card.detail}</div>
        </div>
      ))}
    </div>
  );
}

export function FaviconProductionChecks({
  input,
  assets,
  generatedFingerprint,
}: {
  input: FaviconInput;
  assets: GeneratedAsset[];
  generatedFingerprint?: string;
}) {
  const messages = useMemo(() => mapChecks(input, assets, generatedFingerprint), [assets, generatedFingerprint, input]);
  return <WarningPanel title="Production checks" messages={messages} />;
}
