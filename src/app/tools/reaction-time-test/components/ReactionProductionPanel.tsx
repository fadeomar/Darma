import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Download,
  FileArchive,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  Upload,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type {
  ReactionAuditCheck,
  ReactionAuditSeverity,
  ReactionSummaryCard,
} from "../studio";

const severityMeta: Record<
  ReactionAuditSeverity,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
    badge: "success" | "warning" | "danger" | "soft";
  }
> = {
  error: {
    label: "Error",
    icon: CircleAlert,
    className:
      "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]",
    badge: "danger",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className:
      "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
    badge: "warning",
  },
  info: {
    label: "Info",
    icon: Info,
    className:
      "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
    badge: "soft",
  },
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className:
      "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
    badge: "success",
  },
};

export function ReactionSummaryGrid({
  cards,
}: {
  cards: ReactionSummaryCard[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
            {card.label}
          </p>
          <p
            className="mt-2 truncate text-lg font-black text-[var(--color-text-primary)]"
            title={card.value}
          >
            {card.value}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReactionProductionPanel({
  checks,
  hasAttempt,
  hasHistory,
  isPacking,
  importStatus,
  onImport,
  onDownloadBackup,
  onDownloadMarkdown,
  onDownloadCsv,
  onDownloadPack,
}: {
  checks: ReactionAuditCheck[];
  hasAttempt: boolean;
  hasHistory: boolean;
  isPacking: boolean;
  importStatus: { tone: "success" | "error"; message: string } | null;
  onImport: () => void;
  onDownloadBackup: () => void;
  onDownloadMarkdown: () => void;
  onDownloadCsv: () => void;
  onDownloadPack: () => void;
}) {
  const errors = checks.filter((check) => check.severity === "error").length;
  const warnings = checks.filter(
    (check) => check.severity === "warning",
  ).length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)]/70 p-4 shadow-[var(--shadow-xs)] backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
            Result quality and handoff
          </p>
          <h3 className="mt-1 text-lg font-black text-[var(--color-text-primary)]">
            Audit the latest saved run
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-text-secondary)]">
            Review sample quality, retain round-level evidence, back up local
            history, or package the latest result for comparison.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={errors ? "danger" : warnings ? "warning" : "success"}>
            {errors
              ? `${errors} error${errors === 1 ? "" : "s"}`
              : warnings
                ? `${warnings} warning${warnings === 1 ? "" : "s"}`
                : "Ready"}
          </Badge>
          <Badge variant="outline">Browser local</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {checks.map((check) => {
          const meta = severityMeta[check.severity];
          const Icon = meta.icon;
          return (
            <div
              key={check.id}
              className={`rounded-[var(--radius-md)] border p-3 ${meta.className}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black">{check.title}</p>
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 opacity-90">
                    {check.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-4">
        <div className="flex items-center gap-2">
          <Download
            className="h-4 w-4 text-[var(--color-primary)]"
            aria-hidden
          />
          <p className="text-sm font-black text-[var(--color-text-primary)]">
            Local backup and exports
          </p>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
          JSON restores settings and saved runs. Reports and CSV include
          recorded round timings, so review them before sharing.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Button
            variant="secondary"
            onClick={onImport}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Import JSON
          </Button>
          <Button
            variant="secondary"
            onClick={onDownloadBackup}
            disabled={!hasHistory}
            leftIcon={<FileJson className="h-4 w-4" />}
          >
            Backup JSON
          </Button>
          <Button
            variant="secondary"
            onClick={onDownloadMarkdown}
            disabled={!hasAttempt}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Markdown
          </Button>
          <Button
            variant="secondary"
            onClick={onDownloadCsv}
            disabled={!hasAttempt}
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
          >
            Rounds CSV
          </Button>
          <Button
            onClick={onDownloadPack}
            disabled={!hasAttempt || isPacking}
            leftIcon={<FileArchive className="h-4 w-4" />}
          >
            {isPacking ? "Packing…" : "ZIP pack"}
          </Button>
        </div>
        {importStatus ? (
          <p
            role="status"
            className={`mt-3 rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-bold ${
              importStatus.tone === "success"
                ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"
            }`}
          >
            {importStatus.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
