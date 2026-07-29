"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { clearWorkflowProgress, readWorkflowProgress } from "@/features/tools/workflows/browserState";

export function WorkflowProgressSummary({ workflowId, stepIds }: { workflowId: string; stepIds: string[] }) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const validSteps = new Set(stepIds);
    setCompleted(readWorkflowProgress(workflowId).completedStepIds.filter((stepId) => validSteps.has(stepId)).length);
  }, [stepIds, workflowId]);

  if (completed === 0) return null;

  const totalSteps = stepIds.length;
  const safeCompleted = Math.min(completed, totalSteps);
  const percent = totalSteps > 0 ? Math.round((safeCompleted / totalSteps) * 100) : 0;

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success-text)]" aria-hidden />
        <div>
          <p className="font-bold text-[var(--color-success-text)]">Browser-local progress: {safeCompleted} of {totalSteps} steps</p>
          <p className="mt-1 text-sm text-[var(--color-success-text)]">Your workflow progress stays on this device and is never sent to Darma.</p>
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/55">
            <div className="h-full rounded-full bg-[var(--color-success)]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        onClick={() => {
          clearWorkflowProgress(workflowId);
          setCompleted(0);
        }}
      >
        Reset progress
      </Button>
    </div>
  );
}
