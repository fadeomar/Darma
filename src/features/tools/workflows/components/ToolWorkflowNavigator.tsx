"use client";

import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ListChecks, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import {
  appendWorkflowContext,
  getToolWorkflow,
  type ToolWorkflow,
  type ToolWorkflowStep,
} from "@/features/tools/workflows";
import {
  clearWorkflowProgress,
  markWorkflowStepComplete,
  readWorkflowProgress,
  type WorkflowProgressState,
} from "@/features/tools/workflows/browserState";

function getWorkflowIdFromLocation() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("workflow");
}

function withWorkflow(step: ToolWorkflowStep, workflow: ToolWorkflow) {
  return appendWorkflowContext(step.href, workflow.id);
}

export function ToolWorkflowNavigator({ toolId }: { toolId: string }) {
  const [workflow, setWorkflow] = useState<ToolWorkflow | null>(null);
  const [progress, setProgress] = useState<WorkflowProgressState | null>(null);

  useEffect(() => {
    const workflowId = getWorkflowIdFromLocation();
    const resolved = workflowId ? getToolWorkflow(workflowId) : null;
    setWorkflow(resolved);
    if (resolved) setProgress(readWorkflowProgress(resolved.id));
  }, []);

  const currentIndex = useMemo(
    () => workflow?.steps.findIndex((step) => step.toolId === toolId) ?? -1,
    [toolId, workflow],
  );

  if (!workflow || currentIndex < 0) return null;

  const current = workflow.steps[currentIndex];
  if (!current) return null;
  const previous = workflow.steps[currentIndex - 1] ?? null;
  const next = workflow.steps[currentIndex + 1] ?? null;
  const completed = new Set(progress?.completedStepIds ?? []);
  const completedCount = workflow.steps.filter((step) => completed.has(step.id)).length;
  const progressPercent = Math.round((completedCount / workflow.steps.length) * 100);

  function completeCurrent() {
    const nextProgress = markWorkflowStepComplete(workflow.id, current.id);
    setProgress(nextProgress);
  }

  function resetProgress() {
    clearWorkflowProgress(workflow.id);
    setProgress({ completedStepIds: [], updatedAt: Date.now() });
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">Connected workflow</Badge>
            <Badge variant="outline">Step {currentIndex + 1} of {workflow.steps.length}</Badge>
            {completed.has(current.id) ? (
              <Badge variant="success"><Check className="mr-1 h-3 w-3" aria-hidden />Completed</Badge>
            ) : null}
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-text)]">
              {currentIndex + 1}
            </span>
            <div className="min-w-0">
              <Link href={`/workflows/${workflow.id}`} className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                {workflow.title}
              </Link>
              <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">{current.title}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">{current.description}</p>
              {current.handoff ? <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-tertiary)]">Handoff: {current.handoff}</p> : null}
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-base)]" aria-label={`${progressPercent}% of workflow steps completed`}>
            <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[360px] lg:justify-end">
          {previous ? (
            <Link href={withWorkflow(previous, workflow)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
            </Link>
          ) : null}

          {next ? (
            <Link
              href={withWorkflow(next, workflow)}
              onClick={completeCurrent}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]"
            >
              Complete &amp; continue <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              href={`/workflows/${workflow.id}?completed=1`}
              onClick={completeCurrent}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]"
            >
              Finish workflow <Check className="h-4 w-4" aria-hidden />
            </Link>
          )}

          <Button size="sm" variant="secondary" onClick={resetProgress} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
            Reset
          </Button>
          <Link href={current.href} className="inline-flex min-h-9 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Leave workflow mode">
            <X className="h-3.5 w-3.5" aria-hidden /> Exit
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--color-primary-border)] bg-[var(--color-surface-base)]/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <ListChecks className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
          {workflow.steps.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isComplete = completed.has(step.id);
            return (
              <Link
                key={step.id}
                href={withWorkflow(step, workflow)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-semibold transition ${
                  isCurrent
                    ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${isComplete ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-control-track)] text-[var(--color-text-secondary)]"}`}>
                  {isComplete ? <Check className="h-3 w-3" aria-hidden /> : index + 1}
                </span>
                {step.title}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
