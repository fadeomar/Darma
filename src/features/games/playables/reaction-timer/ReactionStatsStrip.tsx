"use client";

/**
 * Progress dashboard shown BELOW the player (never beside it): lifetime stat
 * cards, a last-attempts mini chart, recent official runs, the achievement
 * gallery, friendly insights, and an accessible reset flow.
 *
 * Accessibility: the chart encodes speed with bar HEIGHT (not colour alone) and
 * every bar carries a text title; achievement state is conveyed with a text
 * label, not colour; the reset flow uses an alertdialog with a focused cancel.
 */

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleSlash,
  Crosshair,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  Lock,
  RotateCcw,
  Target,
  Timer,
  Swords,
  Share2,
  Download,
  Trophy,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui";
import { ReactionBalancingPanel } from "./ReactionBalancingPanel";
import { ReactionProgressionCard } from "./ReactionProgressionCard";
import { cn } from "@/lib/cn";
import {
  ACHIEVEMENTS,
  RARITY_LABELS,
  achievementProgress,
  sortAchievementsForDisplay,
} from "./reactionAchievements";
import { ACCURACY_NOTE, buildLifetimeInsights, formatMs, getRank } from "./reactionScoring";
import { formatSeconds, formatSignedMs, getPrecisionRank } from "./precisionScoring";
import { formatHitMs, formatScore, getTargetHunterRank } from "./targetHunterScoring";
import {
  LEVELS,
  TOTAL_LEVELS,
  formatLevelScore,
  getLevelChallengeRank,
  getLevelDef,
} from "./levelChallengeScoring";
import { formatDailyType, getDailyRank } from "./dailyChallengeScoring";
import { describePlayerResult, formatBattleType } from "./localBattleScoring";
import type { PrecisionStats } from "./precisionTypes";
import type { TargetHunterStats } from "./targetHunterTypes";
import type { LevelChallengeStats } from "./levelChallengeTypes";
import type { DailyChallengeStats } from "./dailyChallengeTypes";
import type { LocalBattleStats } from "./localBattleTypes";
import type { Achievement, ReactionStorageV2 } from "./reactionTypes";

const CHART_MIN_MS = 120;
const CHART_MAX_MS = 600;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function relativeDay(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="rtp-statcard">
      <span className="rtp-statcard-head">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </span>
      <span className="rtp-statcard-value">{value}</span>
    </div>
  );
}

/** Last-attempts bar chart. Shorter bars = faster reactions (height encodes speed). */
function AttemptsChart({ attempts }: { attempts: { ms: number; at: string }[] }) {
  if (attempts.length < 2) {
    return <p className="rtp-empty">Play a few rounds to see your last reactions charted here.</p>;
  }
  const window = attempts.slice(-20);
  return (
    <div className="rtp-chart" role="img" aria-label={`Last ${window.length} reactions, shorter bars are faster`}>
      <div className="rtp-chart-bars">
        {window.map((attempt, index) => {
          const clamped = Math.max(CHART_MIN_MS, Math.min(CHART_MAX_MS, attempt.ms));
          // Faster (lower ms) → taller bar.
          const heightPct = 100 - ((clamped - CHART_MIN_MS) / (CHART_MAX_MS - CHART_MIN_MS)) * 100;
          const rank = getRank(attempt.ms);
          return (
            <span
              key={`${attempt.at}-${index}`}
              className={cn("rtp-chart-bar", `rtp-chart-bar--${rank.id}`)}
              style={{ height: `${Math.max(8, heightPct)}%` }}
              title={`${attempt.ms} ms · ${rank.label}`}
            >
              <span className="sr-only">
                {attempt.ms} ms, {rank.label}
              </span>
            </span>
          );
        })}
      </div>
      <span className="rtp-chart-caption">Shorter bars are faster reactions · last {window.length}</span>
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  stats,
}: {
  achievement: Achievement;
  unlocked: boolean;
  stats: ReactionStorageV2;
}) {
  const progress = !unlocked ? achievementProgress(achievement, stats) : null;
  return (
    <div className={cn("rtp-ach", unlocked ? "rtp-ach--on" : "rtp-ach--off")}>
      <span className="rtp-ach-glyph" aria-hidden>
        {achievement.glyph}
      </span>
      <span className="rtp-ach-body">
        <span className="rtp-ach-titlerow">
          <span className="rtp-ach-title">{achievement.title}</span>
          <span className={cn("rtp-ach-rarity", `rtp-ach-rarity--${achievement.rarity}`)}>
            {RARITY_LABELS[achievement.rarity]}
          </span>
        </span>
        <span className="rtp-ach-desc">{achievement.description}</span>
        <span className="rtp-ach-status">{unlocked ? "Unlocked" : "Locked"}</span>
        {progress ? (
          <span className="rtp-ach-progress" aria-hidden>
            <span className="rtp-ach-progress-bar">
              <span className="rtp-ach-progress-fill" style={{ width: `${progress.pct}%` }} />
            </span>
            <span className="rtp-ach-progress-text">
              {progress.current} / {progress.target}
            </span>
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Precision Timer stats — kept visually separate from reaction metrics so the
 * "difference from target" numbers are never confused with reaction times.
 */
function PrecisionStatsPanel({ precision }: { precision: PrecisionStats }) {
  const recent = precision.recentPrecisionResults;
  const avgDiff = recent.length
    ? Math.round(recent.reduce((sum, r) => sum + r.absDifferenceMs, 0) / recent.length)
    : null;

  return (
    <Card variant="default" padding="lg" className="rtp-precision-stats">
      <div className="rtp-panel-head">
        <Timer className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Precision Timer</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard
          icon={Target}
          label="Best precision"
          value={precision.bestSignedDifferenceMs !== null ? formatSignedMs(precision.bestSignedDifferenceMs) : "—"}
        />
        <StatCard icon={Timer} label="Best target" value={formatSeconds(precision.bestTargetMs)} />
        <StatCard icon={Activity} label="Precision runs" value={String(precision.precisionRuns)} />
        <StatCard icon={Gauge} label="Avg difference" value={avgDiff !== null ? `±${avgDiff} ms` : "—"} />
      </div>

      {recent.length ? (
        <ul className="rtp-history">
          {recent.slice(0, 6).map((result) => {
            const rank = getPrecisionRank(result.absDifferenceMs);
            return (
              <li key={result.id} className="rtp-history-row">
                <span className="rtp-history-rank">
                  <span aria-hidden>{rank.glyph}</span>
                  {rank.label}
                </span>
                <span className="rtp-history-meta">
                  Target {formatSeconds(result.targetMs)} · Stop {formatSeconds(result.elapsedMs)} ·{" "}
                  {formatSignedMs(result.differenceMs)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}

/**
 * Target Hunter stats — kept separate from reaction/precision metrics so score,
 * accuracy, and hit time are never confused with reaction or difference ms.
 */
function TargetHunterStatsPanel({ targetHunter }: { targetHunter: TargetHunterStats }) {
  const recent = targetHunter.recentRuns;
  return (
    <Card variant="default" padding="lg" className="rtp-th-stats">
      <div className="rtp-panel-head">
        <Crosshair className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Target Hunter</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard icon={Trophy} label="Best score" value={formatScore(targetHunter.bestScore)} />
        <StatCard icon={Target} label="Best accuracy" value={`${targetHunter.bestAccuracy}%`} />
        <StatCard icon={Zap} label="Best avg hit" value={formatHitMs(targetHunter.bestAverageHitMs)} />
        <StatCard icon={Activity} label="Best single hit" value={formatHitMs(targetHunter.bestSingleHitMs)} />
        <StatCard icon={Flame} label="Longest combo" value={String(targetHunter.longestCombo)} />
        <StatCard icon={BarChart3} label="Runs" value={String(targetHunter.targetHunterRuns)} />
      </div>

      {recent.length ? (
        <ul className="rtp-history">
          {recent.slice(0, 6).map((run) => {
            const rank = getTargetHunterRank(run.score, run.accuracy, run.averageHitMs);
            return (
              <li key={run.id} className="rtp-history-row">
                <span className="rtp-history-rank">
                  <span aria-hidden>{rank.glyph}</span>
                  {rank.label}
                </span>
                <span className="rtp-history-meta">
                  Score {formatScore(run.score)} · {run.accuracy}% · {run.hits} hits · combo {run.longestCombo}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}

/**
 * Level Challenge stats — a compact progress grid + recent results, kept apart
 * from reaction/precision/target metrics (progression, not raw ms).
 */
function LevelChallengeStatsPanel({ lc }: { lc: LevelChallengeStats }) {
  const recent = lc.recentLevelChallengeRuns;
  return (
    <Card variant="default" padding="lg" className="rtp-lc-stats">
      <div className="rtp-panel-head">
        <Layers className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Level Challenge</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard icon={Trophy} label="Best level" value={lc.bestLevelReached ? `Level ${lc.bestLevelReached}` : "—"} />
        <StatCard icon={Layers} label="Completed" value={`${lc.completedLevels.length} / ${TOTAL_LEVELS}`} />
        <StatCard icon={BarChart3} label="Best score" value={formatLevelScore(lc.bestLevelChallengeScore)} />
      </div>

      <div className="rtp-lc-progress" role="list" aria-label="Level progress">
        {LEVELS.map((def) => {
          const completed = lc.completedLevels.includes(def.level);
          const unlocked = def.level <= lc.unlockedLevel;
          const best = lc.bestLevelScoresByLevel[String(def.level)];
          const state = completed ? "completed" : unlocked ? "current" : "locked";
          return (
            <div
              key={def.id}
              role="listitem"
              className={cn("rtp-lc-progress-cell", `rtp-lc-progress-cell--${state}`)}
              title={`Level ${def.level}: ${def.title} — ${
                completed ? "completed" : unlocked ? "unlocked" : "locked"
              }`}
            >
              <span className="rtp-lc-progress-num">L{def.level}</span>
              <span className="rtp-lc-progress-name">{def.title}</span>
              <span className="rtp-lc-progress-state">
                {state === "locked" ? <Lock className="h-3 w-3" aria-hidden /> : null}
                {completed ? "Done" : unlocked ? "Open" : "Locked"}
              </span>
              {best !== undefined ? <span className="rtp-lc-progress-best">{formatLevelScore(best)}</span> : null}
            </div>
          );
        })}
      </div>

      {recent.length ? (
        <ul className="rtp-history">
          {recent.slice(0, 6).map((run) => {
            const def = getLevelDef(run.level);
            const rank = getLevelChallengeRank(run.passed, run.score, run.accuracy);
            return (
              <li key={run.id} className="rtp-history-row">
                <span className="rtp-history-rank">
                  <span aria-hidden>{rank.glyph}</span>
                  {run.passed ? "Passed" : "Failed"}
                </span>
                <span className="rtp-history-meta">
                  L{run.level} {def.title} · {run.hits}/{run.requiredHits} · {run.accuracy}% · {formatLevelScore(run.score)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}


function DailyChallengeStatsPanel({ daily }: { daily: DailyChallengeStats }) {
  const recent = daily.recentDailyResults;
  const best = daily.localLeaderboards.find((entry) => entry.mode === "daily") ?? null;
  return (
    <Card variant="default" padding="lg" className="rtp-daily-stats">
      <div className="rtp-panel-head">
        <CalendarClock className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Daily Challenge</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard icon={Flame} label="Daily streak" value={String(daily.dailyStreak)} />
        <StatCard icon={Trophy} label="Longest streak" value={String(daily.longestDailyStreak)} />
        <StatCard icon={BarChart3} label="Best daily" value={best ? `${best.score} pts` : "—"} />
        <StatCard icon={CalendarClock} label="Routine" value={daily.weeklyActivity.length ? `${daily.weeklyActivity.length} days` : "—"} />
      </div>

      <div className="rtp-daily-routine-card">
        <span className="rtp-daily-routine-title">Your Reflex Routine</span>
        <span className="rtp-daily-routine-text">
          {daily.lastDailyCompletionDate ? `Last daily completed: ${daily.lastDailyCompletionDate}` : "Play today’s challenge to start your local routine."}
        </span>
        <span className="rtp-daily-routine-note">{daily.weeklyActivity.length ? `${daily.weeklyActivity.length} local play day${daily.weeklyActivity.length === 1 ? "" : "s"} in the recent activity window.` : "New challenge tomorrow."}</span>
      </div>

      {recent.length ? (
        <ul className="rtp-history">
          {recent.slice(0, 6).map((run) => {
            const rank = getDailyRank(run.score);
            return (
              <li key={run.id} className="rtp-history-row">
                <span className="rtp-history-rank">
                  <span aria-hidden>{rank.glyph}</span>
                  {rank.label}
                  {run.objectivePassed ? <span className="rtp-history-clean">Goal</span> : null}
                </span>
                <span className="rtp-history-meta">
                  {run.dateKey} · {formatDailyType(run.challengeType)} · {run.score} pts · {run.primaryMetric}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {daily.localLeaderboards.length ? (
        <div className="rtp-local-board">
          <span className="rtp-local-board-title">Local leaderboard on this device only</span>
          <ol className="rtp-local-board-list">
            {daily.localLeaderboards.slice(0, 5).map((entry, index) => (
              <li key={entry.id} className="rtp-local-board-row">
                <span>#{index + 1}</span>
                <span>{entry.score} pts</span>
                <span>{entry.primaryMetric}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}


function ShareStatsPanel({ stats }: { stats: ReactionStorageV2["share"] }) {
  if (stats.shareCount <= 0) return null;
  return (
    <Card variant="default" padding="lg" className="rtp-share-stats">
      <div className="rtp-panel-head">
        <Share2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Share Cards</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard icon={Share2} label="Shares" value={String(stats.shareCount)} />
        <StatCard icon={Download} label="Downloads" value={String(stats.downloadCount)} />
        <StatCard icon={Target} label="Modes shared" value={`${stats.sharedModes.length}`} />
        <StatCard icon={CalendarClock} label="Last shared" value={relativeDay(stats.lastSharedAt)} />
      </div>
      <p className="rtp-daily-routine-note">
        Result cards are generated locally in your browser. No uploads, account, or backend are used.
      </p>
    </Card>
  );
}


function LocalBattleStatsPanel({ battle }: { battle: LocalBattleStats }) {
  return (
    <Card variant="default" padding="lg" className="rtp-battle-stats">
      <div className="rtp-panel-head">
        <Swords className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h3 className="rtp-panel-title">Local Battle</h3>
      </div>
      <div className="rtp-statgrid" style={{ marginTop: "0.9rem" }}>
        <StatCard icon={Swords} label="Battles" value={String(battle.localBattleRuns)} />
        <StatCard icon={Trophy} label="Last winner" value={battle.lastWinner ?? "—"} />
        <StatCard icon={Zap} label="Best classic avg" value={battle.bestBattleClassicAverage !== null ? `${battle.bestBattleClassicAverage} ms` : "—"} />
        <StatCard icon={Timer} label="Best precision" value={battle.bestBattlePrecisionDiff !== null ? `±${battle.bestBattlePrecisionDiff} ms` : "—"} />
        <StatCard icon={Crosshair} label="Best target score" value={battle.bestBattleTargetScore ? battle.bestBattleTargetScore.toLocaleString() : "—"} />
        <StatCard icon={RotateCcw} label="Rematches" value={String(battle.rematchCount)} />
      </div>

      {battle.recentBattles.length ? (
        <ul className="rtp-history">
          {battle.recentBattles.slice(0, 6).map((run) => (
            <li key={run.id} className="rtp-history-row">
              <span className="rtp-history-rank">
                <span aria-hidden>{run.winner === "draw" ? "🤝" : "⚔️"}</span>
                {formatBattleType(run.battleType)}
                {run.rematch ? <span className="rtp-history-clean">Rematch</span> : null}
              </span>
              <span className="rtp-history-meta">
                {run.winner === "draw" ? "Draw" : `${run.winnerLabel} won`} · {run.marginLabel} · {describePlayerResult(run.winner === "player2" ? run.player2Result : run.player1Result)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="rtp-daily-routine-note">Local battles are stored only on this device.</p>
    </Card>
  );
}

export function ReactionStatsStrip({
  stats,
  hydrated,
  unlockedAchievements,
  onClearStats,
}: {
  stats: ReactionStorageV2;
  hydrated: boolean;
  unlockedAchievements: Set<string>;
  onClearStats: () => void;
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const totalReactions = stats.totalValidRounds + stats.totalEarlyPresses;
  const accuracy = totalReactions > 0 ? Math.round((stats.totalValidRounds / totalReactions) * 100) : 0;
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedAchievements.has(a.id)).length;
  const achievementPct = ACHIEVEMENTS.length ? Math.round((unlockedCount / ACHIEVEMENTS.length) * 100) : 0;
  const insights = hydrated ? buildLifetimeInsights(stats) : [];
  const sortedAchievements = sortAchievementsForDisplay(unlockedAchievements);

  const handleClear = () => {
    onClearStats();
    setConfirmingClear(false);
  };

  return (
    <div className="rtp-stats" id="rtp-stats">
      {hydrated ? <ReactionProgressionCard progression={stats.progression} /> : null}

      <div className="rtp-statgrid">
        <StatCard icon={Trophy} label="Player level" value={hydrated ? `Lv ${stats.progression.level}` : "—"} />
        <StatCard icon={Zap} label="XP" value={hydrated ? stats.progression.xp.toLocaleString() : "—"} />
        <StatCard icon={Trophy} label="Personal best" value={hydrated ? formatMs(stats.bestMs) : "—"} />
        <StatCard icon={BarChart3} label="Best average" value={hydrated ? formatMs(stats.bestAverageMs) : "—"} />
        <StatCard icon={Activity} label="Official runs" value={hydrated ? String(stats.officialRuns) : "—"} />
        <StatCard icon={Target} label="Accuracy" value={hydrated ? `${accuracy}%` : "—"} />
        <StatCard icon={Zap} label="Valid attempts" value={hydrated ? String(stats.totalValidRounds) : "—"} />
        <StatCard icon={CircleSlash} label="Early presses" value={hydrated ? String(stats.totalEarlyPresses) : "—"} />
        <StatCard icon={Flame} label="Day streak" value={hydrated ? `${stats.streak.current}` : "—"} />
        <StatCard icon={CalendarClock} label="Last played" value={hydrated ? relativeDay(stats.lastPlayedAt) : "—"} />
      </div>

      {hydrated && insights.length ? (
        <div className="rtp-insights">
          {insights.map((text) => (
            <p key={text} className="rtp-insight">
              <Lightbulb className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              {text}
            </p>
          ))}
        </div>
      ) : null}

      <Card variant="default" padding="lg" className="rtp-chart-card">
        <div className="rtp-panel-head">
          <Gauge className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <h3 className="rtp-panel-title">Last reactions</h3>
        </div>
        {hydrated ? (
          <AttemptsChart attempts={stats.recentAttempts} />
        ) : (
          <p className="rtp-empty">Loading your recent reactions…</p>
        )}
      </Card>

      <ReactionBalancingPanel />

      {hydrated && stats.precision.precisionRuns > 0 ? <PrecisionStatsPanel precision={stats.precision} /> : null}

      {hydrated && stats.targetHunter.targetHunterRuns > 0 ? (
        <TargetHunterStatsPanel targetHunter={stats.targetHunter} />
      ) : null}

      {hydrated && stats.levelChallenge.levelChallengeRuns > 0 ? (
        <LevelChallengeStatsPanel lc={stats.levelChallenge} />
      ) : null}

      {hydrated && stats.daily.recentDailyResults.length > 0 ? (
        <DailyChallengeStatsPanel daily={stats.daily} />
      ) : null}

      {hydrated && stats.localBattle.localBattleRuns > 0 ? (
        <LocalBattleStatsPanel battle={stats.localBattle} />
      ) : null}

      {hydrated && stats.share.shareCount > 0 ? <ShareStatsPanel stats={stats.share} /> : null}

      <div className="rtp-stats-panels">
        <Card variant="default" padding="lg">
          <div className="rtp-panel-head">
            <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            <h3 className="rtp-panel-title">Recent runs</h3>
          </div>
          {hydrated && stats.lastResults.length ? (
            <ul className="rtp-history">
              {stats.lastResults.slice(0, 6).map((run) => {
                const rank = getRank(run.bestMs);
                return (
                  <li key={run.id} className="rtp-history-row">
                    <span className="rtp-history-rank">
                      <span aria-hidden>{rank.glyph}</span>
                      {rank.label}
                      {run.earlyPresses === 0 ? <span className="rtp-history-clean">Clean</span> : null}
                    </span>
                    <span className="rtp-history-meta">
                      <span className="rtp-history-date">{formatDateTime(run.createdAt)}</span>
                      Best {formatMs(run.bestMs)} · Avg {formatMs(run.averageMs)} · {run.accuracy}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rtp-empty">Play a classic challenge to start tracking your results here.</p>
          )}
        </Card>

        <Card variant="default" padding="lg">
          <div className="rtp-panel-head rtp-panel-head--split">
            <span className="rtp-panel-head-left">
              <Trophy className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              <h3 className="rtp-panel-title">Achievements</h3>
            </span>
            <span className="rtp-ach-count">
              {hydrated ? `${unlockedCount} / ${ACHIEVEMENTS.length} · ${achievementPct}%` : "—"}
            </span>
          </div>
          <div className="rtp-ach-meter" aria-hidden>
            <span className="rtp-ach-meter-fill" style={{ width: `${hydrated ? achievementPct : 0}%` }} />
          </div>
          <div className="rtp-ach-grid">
            {sortedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={hydrated && unlockedAchievements.has(achievement.id)}
                stats={stats}
              />
            ))}
          </div>
        </Card>
      </div>

      <p className="rtp-accuracy-note">{ACCURACY_NOTE}</p>

      {confirmingClear ? (
        <div className="rtp-clear-confirm" role="alertdialog" aria-label="Confirm reset of local reaction stats">
          <span className="rtp-clear-confirm-text">
            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" aria-hidden />
            This permanently erases your best time, averages, history, daily streak, local leaderboard, share history, local progression, and achievements on this device. Your
            settings are kept.
          </span>
          <div className="rtp-clear-confirm-actions">
            <button type="button" onClick={handleClear} className="rtp-clear-confirm-yes">
              Yes, reset everything
            </button>
            <button type="button" onClick={() => setConfirmingClear(false)} className="rtp-clear-confirm-no" autoFocus>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmingClear(true)} className="rtp-clear">
          Reset local reaction stats
        </button>
      )}
    </div>
  );
}
