"use client";

import { ArrowRight, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SessionFlowCopy } from "./reactionSessionFlow";

export function ReactionSessionFlowPanel({
  flow,
  compact = false,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  flow: SessionFlowCopy;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <section
      className={cn("rtp-flow-panel", compact && "rtp-flow-panel--compact", flow.tone && `rtp-flow-panel--${flow.tone}`)}
      aria-label="Session flow guidance"
      data-rtp-control="true"
    >
      <div className="rtp-flow-copy">
        <span className="rtp-flow-eyebrow">Next step</span>
        <h3>{flow.title}</h3>
        <p>{flow.description}</p>
      </div>
      <ol className="rtp-flow-steps" aria-label="Current session progress">
        {flow.steps.map((step) => {
          const Icon = step.status === "done" ? CheckCircle2 : step.status === "active" ? PlayCircle : Circle;
          return (
            <li key={`${step.label}-${step.status}`} className={cn("rtp-flow-step", `rtp-flow-step--${step.status}`)}>
              <Icon className="h-4 w-4" aria-hidden />
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
      {actionLabel || secondaryLabel ? (
        <div className="rtp-flow-actions">
          {actionLabel && onAction ? (
            <Button size="sm" onClick={onAction} leftIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {actionLabel}
            </Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button size="sm" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
