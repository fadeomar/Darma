"use client";

import { Award, BarChart3, ChevronRight, Sparkles, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui";
import { getProgressionRank, getXpProgress, summarizeNextMilestone, XP_EVENT_LABELS } from "./reactionProgression";
import type { ProgressionStats } from "./reactionTypes";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ReactionProgressionCard({ progression }: { progression: ProgressionStats }) {
  const progress = getXpProgress(progression.xp);
  const rank = getProgressionRank(progression.level);
  const recent = progression.xpHistory.slice(0, 5);

  return (
    <Card variant="default" padding="lg" className="rtp-progression-card">
      <div className="rtp-progression-hero">
        <div className="rtp-progression-badge" aria-hidden>
          <span>{rank.glyph}</span>
        </div>
        <div className="rtp-progression-copy">
          <span className="rtp-progression-eyebrow">Local progression</span>
          <h3>
            Level {progression.level} · {progression.rankTitle}
          </h3>
          <p>{rank.note} Progress is stored only on this device.</p>
        </div>
        <div className="rtp-progression-xp" aria-label={`${progression.xp} total XP`}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {progression.xp.toLocaleString()} XP
        </div>
      </div>

      <div className="rtp-progression-meter" aria-label={`${progress.current} of ${progress.needed} XP toward Level ${progress.level + 1}`}>
        <span className="rtp-progression-meter-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <div className="rtp-progression-meta">
        <span>{summarizeNextMilestone(progression)}</span>
        <span>{progress.current} / {progress.needed} XP</span>
      </div>

      <div className="rtp-progression-grid">
        <span className="rtp-progression-mini">
          <Trophy className="h-4 w-4" aria-hidden />
          <strong>{progression.unlockedRankTitles.length}</strong>
          rank titles
        </span>
        <span className="rtp-progression-mini">
          <BarChart3 className="h-4 w-4" aria-hidden />
          <strong>{progression.totalXpEvents}</strong>
          XP events
        </span>
        <span className="rtp-progression-mini">
          <Award className="h-4 w-4" aria-hidden />
          <strong>{progression.lastProgressionUpdate ? formatTime(progression.lastProgressionUpdate) : "—"}</strong>
          last gain
        </span>
      </div>

      {recent.length ? (
        <div className="rtp-progression-recent">
          <span className="rtp-progression-recent-title">
            <Zap className="h-4 w-4" aria-hidden /> Recent XP gains
          </span>
          <ul>
            {recent.map((event, index) => (
              <li key={`${event.at}-${event.kind}-${index}`}>
                <span className="rtp-progression-event-main">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  {event.label || XP_EVENT_LABELS[event.kind]}
                </span>
                <span className="rtp-progression-event-detail">
                  +{event.amount} XP{event.detail ? ` · ${event.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rtp-progression-empty">Complete any mode to start earning local XP.</p>
      )}
    </Card>
  );
}
