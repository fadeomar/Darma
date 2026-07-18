"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Archive, CheckCircle2, Download, FileJson, ListChecks, ShieldCheck } from "lucide-react";
import { TODO_EXPORT_TOOL, TODO_EXPORT_VERSION } from "../../domain/constants";
import type { TodoExportBundle } from "../../domain/types";
import {
  analyzeTodoWorkspace,
  buildTodoAuditMarkdown,
  buildTodoTasksCsv,
  createTodoProductionPack,
  type TodoAuditSeverity,
} from "../../domain/workspaceAudit";
import { useTodo } from "../../state/TodoProvider";

const severityClass: Record<TodoAuditSeverity, string> = {
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100",
  info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100",
  pass: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100",
};

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, content: string, type: string) {
  downloadBlob(filename, new Blob([content], { type }));
}

export function TodoProductionPanel() {
  const { lists, tasks, columns, exportData } = useTodo();
  const [bundle, setBundle] = useState<TodoExportBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setBundle(null);
    void exportData()
      .then((json) => JSON.parse(json) as TodoExportBundle)
      .then((next) => {
        if (!active) return;
        setBundle(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not inspect the local workspace.");
      });
    return () => {
      active = false;
    };
  }, [columns, exportData, lists, tasks]);

  const fallbackBundle = useMemo<TodoExportBundle>(
    () => ({
      tool: TODO_EXPORT_TOOL,
      version: TODO_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      lists,
      tasks,
      columns,
    }),
    [columns, lists, tasks],
  );
  const current = bundle ?? fallbackBundle;
  const audit = useMemo(() => analyzeTodoWorkspace(current), [current]);
  const date = new Date().toISOString().slice(0, 10);

  async function handleZip() {
    setBusy(true);
    try {
      const json = await exportData();
      const fresh = JSON.parse(json) as TodoExportBundle;
      const bytes = await createTodoProductionPack(fresh);
      downloadBlob(`darma-tasks-production-${date}.zip`, new Blob([bytes], { type: "application/zip" }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the production backup.");
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Lists", value: audit.summary.lists, detail: `${audit.summary.archivedLists} archived`, icon: Archive },
    { label: "Open tasks", value: audit.summary.openTasks, detail: `${audit.summary.tasks} total`, icon: ListChecks },
    { label: "Overdue", value: audit.summary.overdueTasks, detail: `${audit.summary.completionRate}% completed`, icon: AlertCircle },
    { label: "Readiness", value: `${audit.summary.readinessScore}/100`, detail: audit.summary.readinessLabel, icon: ShieldCheck },
  ];

  return (
    <section className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5" aria-labelledby="todo-production-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Data safety</p>
          <h2 id="todo-production-title" className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">Workspace health &amp; production backup</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Validate local relationships, preserve archived lists, and create a restorable JSON, audit, CSV snapshot, and README in one ZIP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="todo-btn" onClick={() => downloadText(`darma-tasks-${date}.json`, JSON.stringify(current, null, 2), "application/json")}>
            <FileJson size={15} aria-hidden /> JSON
          </button>
          <button type="button" className="todo-btn" onClick={() => downloadText(`darma-tasks-audit-${date}.md`, buildTodoAuditMarkdown(current, audit), "text/markdown;charset=utf-8")}>
            Audit
          </button>
          <button type="button" className="todo-btn" onClick={() => downloadText(`darma-tasks-${date}.csv`, buildTodoTasksCsv(current), "text/csv;charset=utf-8")}>
            CSV
          </button>
          <button type="button" className="todo-btn todo-btn--primary" disabled={busy} onClick={() => void handleZip()}>
            <Download size={15} aria-hidden /> {busy ? "Building…" : "Production ZIP"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</span>
              <Icon size={16} aria-hidden className="text-[var(--color-accent)]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[var(--color-text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{detail}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">{error}</p>
      ) : null}

      <details className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
        <summary className="cursor-pointer font-semibold text-[var(--color-text-primary)]">
          Production checks ({audit.checks.length})
        </summary>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {audit.checks.map((check) => (
            <div key={check.id} className={`rounded-lg border p-3 text-sm ${severityClass[check.severity]}`}>
              <div className="flex items-start gap-2">
                {check.severity === "pass" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden /> : <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />}
                <div>
                  <p className="font-semibold">{check.severity.toUpperCase()} — {check.title}</p>
                  <p className="mt-1 leading-5 opacity-90">{check.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
