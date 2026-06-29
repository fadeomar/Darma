"use client";

import { Crosshair, Gauge, Layers, SlidersHorizontal, Timer } from "lucide-react";
import { Card } from "@/components/ui";
import { BALANCING_SUMMARY, REACTION_BALANCING_VERSION, reactionBalancing } from "./reactionBalancing";
import { formatSeconds } from "./precisionScoring";

function BalanceChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rtp-balance-chip">
      <span className="rtp-balance-chip-label">{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

/**
 * Sprint 13 tuning summary. Shown below the player as a transparent QA/design
 * note so future contributors can understand the current balance direction.
 */
export function ReactionBalancingPanel() {
  const classic = reactionBalancing.classic;
  const precision = reactionBalancing.precision;
  const hunter = reactionBalancing.targetHunter;
  const levels = reactionBalancing.levelChallenge;

  return (
    <Card variant="default" padding="lg" className="rtp-balance-panel">
      <div className="rtp-panel-head rtp-panel-head--split">
        <span className="rtp-panel-head-left">
          <SlidersHorizontal className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="rtp-panel-title">Gameplay balancing</h3>
        </span>
        <span className="rtp-balance-version">{REACTION_BALANCING_VERSION}</span>
      </div>

      <div className="rtp-balance-grid" aria-label="Current balancing values">
        <div className="rtp-balance-card">
          <Timer className="h-4 w-4" aria-hidden />
          <span className="rtp-balance-card-title">Classic</span>
          <BalanceChip label="Rounds" value={String(classic.rounds)} />
          <BalanceChip label="Wait" value={`${classic.waitMinMs / 1000}s–${classic.waitMaxMs / 1000}s`} />
          <BalanceChip label="Good under" value={`${classic.rankThresholds.goodMs}ms`} />
        </div>
        <div className="rtp-balance-card">
          <Gauge className="h-4 w-4" aria-hidden />
          <span className="rtp-balance-card-title">Precision</span>
          <BalanceChip label="Default" value={formatSeconds(precision.defaultTargetMs)} />
          <BalanceChip label="Excellent" value={`≤${precision.rankThresholds.excellentMs}ms`} />
          <BalanceChip label="Close" value={`≤${precision.rankThresholds.closeMs}ms`} />
        </div>
        <div className="rtp-balance-card">
          <Crosshair className="h-4 w-4" aria-hidden />
          <span className="rtp-balance-card-title">Target Hunter</span>
          <BalanceChip label="Run" value={`${hunter.durationMs / 1000}s`} />
          <BalanceChip label="Target" value={`${hunter.targetDiameterDesktop}px / ${hunter.targetDiameterMobile}px`} />
          <BalanceChip label="Elite" value={`${hunter.rankThresholds.eliteScore}+`} />
        </div>
        <div className="rtp-balance-card">
          <Layers className="h-4 w-4" aria-hidden />
          <span className="rtp-balance-card-title">Levels</span>
          <BalanceChip label="Count" value={String(levels.totalLevels)} />
          <BalanceChip label="Mobile scale" value={`${Math.round(levels.mobileScale * 100)}%`} />
          <BalanceChip label="Spawn gap" value={`${levels.nextSpawnDelayMs}ms`} />
        </div>
      </div>

      <div className="rtp-balance-notes">
        {BALANCING_SUMMARY.map((item) => (
          <p key={item.title}>
            <strong>{item.title}:</strong> {item.detail}
          </p>
        ))}
      </div>
    </Card>
  );
}
