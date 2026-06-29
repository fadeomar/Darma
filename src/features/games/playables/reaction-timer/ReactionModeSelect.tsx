"use client";

/**
 * Mode selector shown in the idle arena. Clean, touch-friendly mode cards for
 * Classic Reaction, Practice, and Precision Timer — plus a compact lifetime
 * snapshot. Each card explains what the mode tests and offers one clear CTA.
 */

import { CalendarClock, Crosshair, Gauge, Layers, Swords, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMs } from "./reactionScoring";
import { formatSignedMs } from "./precisionScoring";
import type { ReactionStorageV2, RunSummary } from "./reactionTypes";

type Mode = {
  id: "classic" | "practice" | "precision" | "target-hunter" | "level-challenge" | "daily-challenge" | "local-battle";
  icon: typeof Zap;
  title: string;
  description: string;
  badges: string[];
  cta: string;
  duration: string;
  difficulty: string;
  bestInput: string;
  variant: "primary" | "secondary" | "ghost";
};

const MODES: Mode[] = [
  {
    id: "classic",
    icon: Zap,
    title: "Classic Reaction",
    description: "Wait for the signal, then react as fast as you can. Five rounds, your best time wins.",
    badges: ["5 rounds", "Reaction"],
    cta: "Start Classic",
    duration: "45–60 sec",
    difficulty: "Beginner",
    bestInput: "Mouse / touch / keyboard",
    variant: "primary",
  },
  {
    id: "practice",
    icon: Gauge,
    title: "Practice",
    description: "Warm up with relaxed rounds. Great for getting loose — keeps your day streak alive.",
    badges: ["Warm-up", "Endless"],
    cta: "Practice",
    duration: "Open-ended",
    difficulty: "Beginner",
    bestInput: "Any input",
    variant: "secondary",
  },
  {
    id: "precision",
    icon: Timer,
    title: "Precision Timer",
    description: "Stop the timer as close as possible to the target time. A test of control, not speed.",
    badges: ["Timing", "Control"],
    cta: "Open Precision",
    duration: "30–45 sec",
    difficulty: "Intermediate",
    bestInput: "Keyboard or click",
    variant: "secondary",
  },
  {
    id: "target-hunter",
    icon: Crosshair,
    title: "Target Hunter",
    description: "Tap the target as soon as it appears. Build speed, accuracy, and focus in 30 seconds.",
    badges: ["30s", "Accuracy", "Canvas"],
    cta: "Open Target Hunter",
    duration: "30 sec",
    difficulty: "Intermediate",
    bestInput: "Pointer / touch",
    variant: "secondary",
  },
  {
    id: "level-challenge",
    icon: Layers,
    title: "Level Challenge",
    description: "Clear six reflex levels: signal, fade, shrink, move, decoy, and elite.",
    badges: ["6 levels", "Progression", "Focus"],
    cta: "Open Level Challenge",
    duration: "3–5 min",
    difficulty: "Advanced",
    bestInput: "Pointer / touch",
    variant: "secondary",
  },
  {
    id: "daily-challenge",
    icon: CalendarClock,
    title: "Daily Challenge",
    description: "Play today’s seeded reflex challenge and keep your local streak alive.",
    badges: ["Daily", "Streak", "Local only"],
    cta: "Open Daily",
    duration: "2–4 min",
    difficulty: "Varies",
    bestInput: "Depends on challenge",
    variant: "secondary",
  },
  {
    id: "local-battle",
    icon: Swords,
    title: "Local Battle",
    description: "Take turns on the same device and see who has the sharper reflexes.",
    badges: ["2 players", "Local only", "No login"],
    cta: "Open Battle",
    duration: "2–4 min",
    difficulty: "Social",
    bestInput: "Same device",
    variant: "secondary",
  },
];

export function ReactionModeSelect({
  stats,
  hydrated,
  lastResult,
  onStartClassic,
  onStartPractice,
  onOpenPrecision,
  onOpenTargetHunter,
  onOpenLevelChallenge,
  onOpenDailyChallenge,
  onOpenLocalBattle,
  isNewUser = false,
  recommendedMode = "classic",
}: {
  stats: ReactionStorageV2;
  hydrated: boolean;
  lastResult: RunSummary | null;
  onStartClassic: () => void;
  onStartPractice: () => void;
  onOpenPrecision: () => void;
  onOpenTargetHunter: () => void;
  onOpenLevelChallenge: () => void;
  onOpenDailyChallenge: () => void;
  onOpenLocalBattle: () => void;
  isNewUser?: boolean;
  recommendedMode?: Mode["id"];
}) {
  const handlers: Record<Mode["id"], () => void> = {
    classic: onStartClassic,
    practice: onStartPractice,
    precision: onOpenPrecision,
    "target-hunter": onOpenTargetHunter,
    "level-challenge": onOpenLevelChallenge,
    "daily-challenge": onOpenDailyChallenge,
    "local-battle": onOpenLocalBattle,
  };

  return (
    <div className="rtp-modeselect">
      <span className="rtp-eyebrow">Reaction Timer Pro</span>
      <h2 className="rtp-lobby-title">Choose a mode</h2>
      {isNewUser ? (
        <p className="rtp-mode-tip">
          New here? Classic Reaction is the fastest way to learn the flow. Advanced modes are here when you want them.
        </p>
      ) : null}

      <div className="rtp-modecards">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isRecommended = recommendedMode === mode.id && (isNewUser || mode.id === "classic");
          return (
            <div key={mode.id} className={cn("rtp-modecard", isRecommended && "rtp-modecard--recommended")}>
              {isRecommended ? <span className="rtp-modecard-recommend">Recommended first</span> : null}
              <span className="rtp-modecard-icon" aria-hidden>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="rtp-modecard-title">{mode.title}</h3>
              <p className="rtp-modecard-desc">{mode.description}</p>
              <div className="rtp-modecard-badges">
                {mode.badges.map((badge) => (
                  <span key={badge} className="rtp-modecard-badge">
                    {badge}
                  </span>
                ))}
              </div>
              <dl className="rtp-modecard-meta" aria-label={`${mode.title} details`}>
                <div>
                  <dt>Time</dt>
                  <dd>{mode.duration}</dd>
                </div>
                <div>
                  <dt>Level</dt>
                  <dd>{mode.difficulty}</dd>
                </div>
                <div>
                  <dt>Input</dt>
                  <dd>{mode.bestInput}</dd>
                </div>
              </dl>
              <Button
                variant={mode.variant === "primary" ? "primary" : mode.variant === "secondary" ? "secondary" : "ghost"}
                onClick={handlers[mode.id]}
                leftIcon={<Icon className="h-4 w-4" aria-hidden />}
                className="rtp-modecard-cta"
              >
                {mode.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rtp-lobby-stats" aria-live="polite">
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best reaction</span>
          <span className="rtp-lobby-stat-value">{hydrated ? formatMs(stats.bestMs) : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Best precision</span>
          <span className="rtp-lobby-stat-value">
            {hydrated && stats.precision.bestSignedDifferenceMs !== null
              ? formatSignedMs(stats.precision.bestSignedDifferenceMs)
              : "—"}
          </span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Daily streak</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${stats.daily.dailyStreak}` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Local battles</span>
          <span className="rtp-lobby-stat-value">{hydrated ? `${stats.localBattle.localBattleRuns}` : "—"}</span>
        </div>
        <div className="rtp-lobby-stat">
          <span className="rtp-lobby-stat-label">Last result</span>
          <span className="rtp-lobby-stat-value">
            {hydrated && lastResult ? `${formatMs(lastResult.averageMs)} avg` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
