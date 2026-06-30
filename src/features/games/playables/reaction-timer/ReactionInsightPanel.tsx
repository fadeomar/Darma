"use client";

import { useId } from "react";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatInputMethod, type ResultInsight } from "./reactionInsights";

export function ReactionInsightPanel({ insight, compact = false }: { insight: ResultInsight; compact?: boolean }) {
  const inputLabel = formatInputMethod(insight.inputMethod);
  const titleId = useId();
  return (
    <section className={cn("rtp-insight-panel", compact && "rtp-insight-panel--compact")} aria-labelledby={titleId}>
      <div className="rtp-insight-head">
        <span className="rtp-insight-icon" aria-hidden>
          <Lightbulb className="h-4 w-4" />
        </span>
        <h3 id={titleId}>{insight.title}</h3>
      </div>
      <ul className="rtp-insight-list">
        {insight.messages.map((message) => (
          <li key={message.text} className={cn("rtp-insight-item", message.tone && `rtp-insight-item--${message.tone}`)}>
            {message.text}
          </li>
        ))}
      </ul>
      <div className="rtp-insight-tip">
        <strong>Tip for next run:</strong> {insight.tip}
      </div>
      {inputLabel ? <p className="rtp-insight-input">{inputLabel}. Different input methods can produce slightly different results.</p> : null}
      {insight.accuracyNote ? (
        <p className="rtp-accuracy-note">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <span>{insight.accuracyNote}</span>
        </p>
      ) : null}
    </section>
  );
}
