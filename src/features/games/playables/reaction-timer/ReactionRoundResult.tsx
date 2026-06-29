"use client";

/** Round-result overlay with auto-progress to the next round. */

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { CLASSIC_ROUNDS, formatMs, getRank, getTip } from "./reactionScoring";
import type { GameMode, ReactionAttempt } from "./reactionTypes";

export function ReactionRoundResult({
  attempt,
  validCount,
  mode,
  bestMs,
  reducedMotion,
  autoAdvance = true,
  onNext,
}: {
  attempt: ReactionAttempt | null;
  validCount: number;
  mode: GameMode;
  bestMs: number | null;
  reducedMotion: boolean;
  autoAdvance?: boolean;
  onNext: () => void;
}) {
  const ms = attempt?.reactionMs ?? null;
  const rank = getRank(ms);
  const isBest = ms !== null && (bestMs === null || ms <= bestMs);
  const totalLabel = mode === "classic" ? `Round ${Math.min(validCount, CLASSIC_ROUNDS)} of ${CLASSIC_ROUNDS}` : "Practice round";

  return (
    <div className="rtp-result">
      <span className="rtp-eyebrow">{totalLabel}</span>
      <div className="rtp-result-time">{formatMs(ms)}</div>
      <div className="rtp-rank-badge">
        <span aria-hidden>{rank.glyph}</span>
        <span>{rank.label}</span>
        {isBest ? <span className="rtp-rank-best">New best</span> : null}
      </div>
      <p className="rtp-result-tip">{getTip(ms, false)}</p>

      <div className="rtp-result-actions">
        <Button onClick={onNext} leftIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
          Next now
        </Button>
        {autoAdvance ? (
          <span className="rtp-autoprogress" aria-live="polite">
            {reducedMotion ? (
              "Next round starting…"
            ) : (
              <>
                <span className="rtp-autoprogress-bar" aria-hidden>
                  <span className="rtp-autoprogress-fill" />
                </span>
                Next round starts automatically
              </>
            )}
          </span>
        ) : (
          <span className="rtp-autoprogress" aria-live="polite">
            Press “Next now” to continue
          </span>
        )}
      </div>
    </div>
  );
}
