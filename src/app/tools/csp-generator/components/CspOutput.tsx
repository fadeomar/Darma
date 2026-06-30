"use client";

import { CodeOutputPanel } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { CspRiskLevel } from "../types";

const RISK_META: Record<CspRiskLevel, { label: string; className: string }> = {
  strong: { label: "Strong", className: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]" },
  moderate: { label: "Moderate", className: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]" },
  permissive: { label: "Permissive", className: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" },
  risky: { label: "Risky", className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" },
  invalid: { label: "Invalid", className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" },
};

export function CspOutput({
  risk,
  reportOnly,
  onToggleReportOnly,
  header,
  meta,
  nextjs,
  nginx,
  vercel,
}: {
  risk: CspRiskLevel;
  reportOnly: boolean;
  onToggleReportOnly: (value: boolean) => void;
  header: string;
  meta: string;
  nextjs: string;
  nginx: string;
  vercel: string;
}) {
  const riskMeta = RISK_META[risk];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Policy strength</span>
          <span className={cn("rounded-[var(--radius-full)] border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]", riskMeta.className)}>
            {riskMeta.label}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reportOnly}
          onClick={() => onToggleReportOnly(!reportOnly)}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius-full)] border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition",
            reportOnly
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)]",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", reportOnly ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]")} aria-hidden />
          Report-only {reportOnly ? "on" : "off"}
        </button>
      </div>

      <CodeOutputPanel
        title="Your CSP"
        description="Copy the format that matches where you deploy. Test in report-only mode first."
        defaultTab="header"
        tabs={[
          { id: "header", label: "HTTP Header", code: header, language: "http", filename: "csp-header.txt" },
          { id: "meta", label: "Meta Tag", code: meta, language: "html", filename: "csp-meta.html" },
          { id: "nextjs", label: "Next.js", code: nextjs, language: "ts", filename: "next.config.ts" },
          { id: "nginx", label: "Nginx", code: nginx, language: "nginx", filename: "csp.nginx.conf" },
          { id: "vercel", label: "Vercel", code: vercel, language: "json", filename: "vercel.json" },
        ]}
      />
    </div>
  );
}
