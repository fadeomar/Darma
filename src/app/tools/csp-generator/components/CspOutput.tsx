"use client";

import { AlertTriangle, KeyRound } from "lucide-react";
import { CodeOutputPanel } from "@/features/tools/components";
import { cn } from "@/lib/cn";
import type { CspPolicyMode } from "../builder";
import type { CspRiskLevel } from "../types";

const RISK_META: Record<CspRiskLevel, { label: string; className: string; helper: string }> = {
  strong: {
    label: "Strong",
    helper: "Strict baseline with no major warnings.",
    className: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  },
  moderate: {
    label: "Moderate",
    helper: "Good starting point. Review warnings before production.",
    className: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
  },
  permissive: {
    label: "Permissive",
    helper: "Works broadly, but allows wider sources than ideal.",
    className: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  },
  risky: {
    label: "Risky",
    helper: "Contains risky sources or high-severity warnings.",
    className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
  },
  invalid: {
    label: "Invalid",
    helper: "Fix errors before using this policy.",
    className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
  },
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
  netlify,
  apache,
  express,
  cloudflare,
  explanation,
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
  netlify: string;
  apache: string;
  express: string;
  cloudflare: string;
  explanation: string;
}) {
  const riskMeta = RISK_META[risk];

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Policy strength</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-[var(--radius-full)] border px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.08em]", riskMeta.className)}>
                {riskMeta.label}
              </span>
              <span className="text-xs leading-5 text-[var(--color-text-secondary)]">{riskMeta.helper}</span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reportOnly}
            onClick={() => onToggleReportOnly(!reportOnly)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-full)] border px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] transition",
              reportOnly
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)]"
                : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)]",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", reportOnly ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]")} aria-hidden />
            Report-only {reportOnly ? "on" : "off"}
          </button>
        </div>
      </div>

      {mode === "strict" ? (
        <div className="flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2.5 text-[var(--color-warning-text)] shadow-[var(--shadow-xs)]">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <div className="min-w-0 space-y-1 text-xs leading-5">
            <p className="font-bold">Strict mode needs a per-request nonce</p>
            <p>
              Generate a fresh random nonce on <span className="font-bold">every response</span> and inject it into both the header and trusted
              <code className="mx-1 rounded bg-black/10 px-1 font-mono">&lt;script&gt;</code> tags. Use the <span className="font-bold">Next.js</span> tab for a middleware pattern.
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
              Use server headers for report-only. The <span className="font-bold">Meta Tag</span> tab is replaced with a warning because meta CSP can only enforce.
            </p>
          </div>
        </div>
      ) : null}

      <CodeOutputPanel
        title="Your CSP"
        description="Copy the format that matches your deploy target. Test in report-only mode before enforcing."
        defaultTab="header"
        className="[&_[role=tablist]]:!max-w-full [&_[role=tablist]]:!overflow-x-auto [&_pre]:!min-h-[14rem] [&_pre]:!max-h-[24rem]"
        tabs={[
          { id: "header", label: "Header", code: header, language: "http", filename: "csp-header.txt" },
          { id: "nextjs", label: "Next.js", code: nextjs, language: "ts", filename: mode === "strict" ? "middleware.ts" : "next.config.ts" },
          { id: "vercel", label: "Vercel", code: vercel, language: "json", filename: "vercel.json" },
          { id: "nginx", label: "Nginx", code: nginx, language: "nginx", filename: "csp.nginx.conf" },
          { id: "meta", label: "Meta", code: meta, language: "html", filename: "csp-meta.html" },
          { id: "netlify", label: "Netlify", code: netlify, language: "text", filename: "_headers" },
          { id: "apache", label: "Apache", code: apache, language: "apache", filename: ".htaccess" },
          { id: "express", label: "Express", code: express, language: "js", filename: "server.js" },
          { id: "cloudflare", label: "Worker", code: cloudflare, language: "ts", filename: "worker.ts" },
          { id: "explain", label: "Explain", code: explanation, language: "text", filename: "csp-explanation.txt" },
        ]}
      />
    </div>
  );
}
