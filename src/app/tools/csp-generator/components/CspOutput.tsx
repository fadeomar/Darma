"use client";

import { AlertTriangle, KeyRound } from "lucide-react";
import { CodeOutputPanel } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { CspPolicyMode } from "../builder";
import type { CspRiskLevel } from "../types";

const RISK_META: Record<CspRiskLevel, { label: string; className: string }> = {
  strong: { label: "Strong", className: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]" },
  moderate: { label: "Moderate", className: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]" },
  permissive: { label: "Permissive", className: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" },
  risky: { label: "Risky", className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" },
  invalid: { label: "Invalid", className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" },
};

export function CspOutput({
  mode,
  risk,
  reportOnly,
  onToggleReportOnly,
  header,
  meta,
  nextjs,
  nginx,
  vercel,
}: {
  mode: CspPolicyMode;
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

      {mode === "strict" ? (
        <div className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2.5 text-[var(--color-warning-text)] shadow-[var(--shadow-xs)]">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <div className="min-w-0 space-y-1 text-xs leading-5">
            <p className="font-bold">Strict mode needs a per-request nonce</p>
            <p>
              Generate a fresh random nonce on <span className="font-bold">every response</span> and inject it into both the header and your trusted
              <code className="mx-1 rounded bg-black/10 px-1 font-mono">&lt;script&gt;</code> tags. Never ship <code className="rounded bg-black/10 px-1 font-mono">{"{RANDOM_NONCE}"}</code> as a
              static value — a static <code className="rounded bg-black/10 px-1 font-mono">next.config</code> header is not enough. Use the <span className="font-bold">Next.js</span> tab for the middleware pattern.
            </p>
          </div>
        </div>
      ) : null}

      {reportOnly ? (
        <div className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2.5 text-[var(--color-info-text)] shadow-[var(--shadow-xs)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <div className="min-w-0 space-y-1 text-xs leading-5">
            <p className="font-bold">Report-only logs violations without blocking</p>
            <p>
              Use the <span className="font-bold">HTTP Header</span>, <span className="font-bold">Next.js</span>, <span className="font-bold">Nginx</span>, or <span className="font-bold">Vercel</span> output.
              The <span className="font-bold">Meta Tag</span> cannot be report-only — a meta CSP always enforces, so it is disabled here.
            </p>
          </div>
        </div>
      ) : null}

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
