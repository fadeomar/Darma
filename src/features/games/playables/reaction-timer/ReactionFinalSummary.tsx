"use client";

/** Celebratory-but-clean summary after a finished classic run. */

import { useState } from "react";
import { BarChart3, Check, Copy, Gauge, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { analyzeRun, buildShareText, formatMs } from "./reactionScoring";
import { ReactionInsightPanel } from "./ReactionInsightPanel";
import { ReactionFirstRunGuide } from "./ReactionOnboardingCard";
import { ReactionSharePanel } from "./ReactionSharePanel";
import { buildClassicInsight, type InputMethod } from "./reactionInsights";
import { buildClassicShareResult, type ShareActionKind, type ShareableGameResult } from "./reactionShareCard";
import type { RunSummary } from "./reactionTypes";

function SummaryStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rtp-summary-stat">
      <span className="rtp-summary-stat-label">{label}</span>
      <span className="rtp-summary-stat-value">{value}</span>
      {hint ? <span className="rtp-summary-stat-hint">{hint}</span> : null}
    </div>
  );
}

export function ReactionFinalSummary({
  run,
  previousBestMs,
  previousBestAverageMs,
  previousRun,
  onPlayAgain,
  onPractice,
  onMenu,
  onViewStats,
  inputMethod = "unknown",
  showFirstRunGuide = false,
  onShareAction,
}: {
  run: RunSummary;
  previousBestMs: number | null;
  previousBestAverageMs: number | null;
  previousRun: RunSummary | null;
  onPlayAgain: () => void;
  onPractice: () => void;
  onMenu: () => void;
  onViewStats?: () => void;
  inputMethod?: InputMethod;
  showFirstRunGuide?: boolean;
  onShareAction?: (action: ShareActionKind, result: ShareableGameResult) => void;
}) {
  const [copied, setCopied] = useState(false);
  const analysis = analyzeRun(run, previousBestMs, previousBestAverageMs, previousRun);
  const { rank } = analysis;
  const education = buildClassicInsight({ run, previousBestMs, previousBestAverageMs, previousRun, inputMethod });
  const shareResult = buildClassicShareResult({ run, previousBestMs, previousBestAverageMs, previousRun });

  // Headline comparison line + tone.
  let prText: string;
  let prRecord = false;
  if (previousBestMs === null) {
    prText = "First official result saved";
    prRecord = true;
  } else if (analysis.improvementVsBestMs !== null && analysis.improvementVsBestMs > 0) {
    prText = `New personal best · improved by ${analysis.improvementVsBestMs} ms`;
    prRecord = true;
  } else if (analysis.improvementVsBestMs === 0) {
    prText = "Tied your best";
  } else {
    prText = `${Math.abs(analysis.improvementVsBestMs ?? 0)} ms from your best`;
  }

  // Progress insight chips (analysis-derived; no medical or absolute claims).
  const insights: { tone: "good" | "info" | "warn"; text: string }[] = [];
  if (analysis.cleanRun) {
    insights.push({ tone: "good", text: "Clean run — no early taps" });
  } else {
    insights.push({ tone: "warn", text: "Try waiting for the signal instead of predicting it" });
  }
  if (analysis.improvementVsAverageMs !== null && analysis.improvementVsAverageMs > 0) {
    insights.push({ tone: "good", text: `Average improved by ${analysis.improvementVsAverageMs} ms` });
  }
  if (!prRecord && analysis.improvementVsBestMs !== null) {
    insights.push({ tone: "info", text: `${Math.abs(analysis.improvementVsBestMs)} ms from your best` });
  }
  if (analysis.personalBestAverage && previousBestAverageMs !== null) {
    insights.push({ tone: "good", text: "Best average yet" });
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildShareText(run));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="rtp-summary">
      <div className="rtp-summary-trophy" aria-hidden>
        {rank.glyph}
      </div>
      <span className="rtp-eyebrow">Challenge complete</span>
      <h2 className="rtp-summary-title">{rank.label}</h2>
      <p className="rtp-summary-note">{rank.note}</p>

      <div className="rtp-summary-grid">
        <SummaryStat label="Best" value={formatMs(run.bestMs)} hint="Fastest round" />
        <SummaryStat label="Average" value={formatMs(run.averageMs)} />
        <SummaryStat label="Median" value={formatMs(run.medianMs)} />
        <SummaryStat label="Worst" value={formatMs(run.worstMs)} />
        <SummaryStat label="Accuracy" value={`${run.accuracy}%`} hint={`${run.earlyPresses} early`} />
        <SummaryStat label="Consistency" value={`${run.consistency}%`} hint="Tighter is better" />
      </div>

      <p className={cn("rtp-summary-pr", prRecord && "rtp-summary-pr--record")}>
        {prRecord ? <Sparkles className="h-4 w-4" aria-hidden /> : null}
        {prText}
      </p>

      {insights.length ? (
        <ul className="rtp-summary-insights">
          {insights.map((insight) => (
            <li key={insight.text} className={cn("rtp-summary-insight", `rtp-summary-insight--${insight.tone}`)}>
              {insight.text}
            </li>
          ))}
        </ul>
      ) : null}

      <ReactionInsightPanel insight={education} />

      {showFirstRunGuide ? <ReactionFirstRunGuide /> : null}

      <ReactionSharePanel result={shareResult} onShareAction={onShareAction} compact />

      <div className="rtp-summary-actions">
        <Button size="lg" onClick={onPlayAgain} leftIcon={<Zap className="h-5 w-5" aria-hidden />}>
          Play again
        </Button>
        <Button size="lg" variant="secondary" onClick={onPractice} leftIcon={<Gauge className="h-5 w-5" aria-hidden />}>
          Practice
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
        >
          {copied ? "Copied" : "Copy result"}
        </Button>
        {onViewStats ? (
          <Button size="lg" variant="ghost" onClick={onViewStats} leftIcon={<BarChart3 className="h-5 w-5" aria-hidden />}>
            View stats
          </Button>
        ) : null}
        <Button size="lg" variant="ghost" onClick={onMenu} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Menu
        </Button>
      </div>
    </div>
  );
}
