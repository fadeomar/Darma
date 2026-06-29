/**
 * Educational insights for Reaction Timer Pro.
 *
 * These helpers intentionally avoid medical claims. They translate gameplay
 * numbers into friendly coaching notes and explain browser/device limitations.
 * Components can render the returned text in HTML so important information is
 * never trapped inside Canvas-only visuals.
 */

import { ACCURACY_NOTE, analyzeRun, formatMs } from "./reactionScoring";
import { formatSeconds, formatSignedMs, getPrecisionRank } from "./precisionScoring";
import { formatHitMs, formatScore, getTargetHunterRank } from "./targetHunterScoring";
import { formatLevelMs, formatLevelScore, getLevelDef } from "./levelChallengeScoring";
import { formatDailyType, getDailyRank } from "./dailyChallengeScoring";
import { describePlayerResult, formatBattleType } from "./localBattleScoring";
import type { DailyChallengeResult } from "./dailyChallengeTypes";
import type { LevelChallengeResult } from "./levelChallengeTypes";
import type { LocalBattleResult } from "./localBattleTypes";
import type { PrecisionResult } from "./precisionTypes";
import type { ReactionStorageV2, RunSummary } from "./reactionTypes";
import type { TargetHunterResult } from "./targetHunterTypes";

export type InputMethod = "mouse" | "touch" | "keyboard" | "pen" | "unknown";

export type InsightMessage = {
  tone?: "good" | "info" | "warn";
  text: string;
};

export type ResultInsight = {
  title: string;
  messages: InsightMessage[];
  tip: string;
  inputMethod?: InputMethod;
  accuracyNote?: string;
};

export const BROWSER_ACCURACY_NOTE =
  `${ACCURACY_NOTE} Use it to practice and compare your own local progress over time, not as a medical or diagnostic measurement.`;

export function formatInputMethod(method?: InputMethod): string | null {
  if (!method || method === "unknown") return null;
  if (method === "mouse") return "Input: mouse";
  if (method === "touch") return "Input: touch";
  if (method === "keyboard") return "Input: keyboard";
  if (method === "pen") return "Input: pen";
  return null;
}

export function buildClassicInsight({
  run,
  previousBestMs,
  previousBestAverageMs,
  previousRun,
  inputMethod,
}: {
  run: RunSummary;
  previousBestMs: number | null;
  previousBestAverageMs: number | null;
  previousRun: RunSummary | null;
  inputMethod?: InputMethod;
}): ResultInsight {
  const analysis = analyzeRun(run, previousBestMs, previousBestAverageMs, previousRun);
  const messages: InsightMessage[] = [];

  if (analysis.cleanRun) {
    messages.push({ tone: "good", text: "Clean run — no early taps. That usually means you reacted to the cue instead of guessing." });
  } else {
    messages.push({ tone: "warn", text: "Early taps suggest prediction. Try waiting for the visual signal before pressing." });
  }

  if (run.bestMs !== null && run.averageMs !== null && run.averageMs - run.bestMs >= 45) {
    messages.push({ tone: "info", text: `Your fastest round was ${run.averageMs - run.bestMs} ms quicker than your average. Aim for relaxed consistency.` });
  } else if (run.consistency >= 85) {
    messages.push({ tone: "good", text: "Your reactions were tightly grouped. Consistency is a strong sign of focus." });
  }

  if (analysis.improvementVsBestMs !== null && analysis.improvementVsBestMs > 0) {
    messages.push({ tone: "good", text: `You improved your best reaction by ${analysis.improvementVsBestMs} ms.` });
  } else if (analysis.improvementVsAverageMs !== null && analysis.improvementVsAverageMs > 0) {
    messages.push({ tone: "good", text: `Your average improved by ${analysis.improvementVsAverageMs} ms compared with the previous run.` });
  }

  return {
    title: "What this means",
    messages: messages.slice(0, 3),
    tip: run.earlyPresses > 0
      ? "Relax your hand and watch the arena, not the button. React to the change instead of anticipating it."
      : "Try fullscreen for fewer distractions, then compare your average across several runs instead of judging one attempt.",
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

export function buildPrecisionInsight(result: PrecisionResult, inputMethod?: InputMethod): ResultInsight {
  const rank = getPrecisionRank(result.absDifferenceMs);
  const timing = result.differenceMs === 0
    ? "exactly on target"
    : result.early
      ? `${formatSignedMs(result.differenceMs)} early`
      : `${formatSignedMs(result.differenceMs)} late`;

  const messages: InsightMessage[] = [
    { tone: result.absDifferenceMs <= 75 ? "good" : result.absDifferenceMs <= 250 ? "info" : "warn", text: `You stopped ${timing} from ${formatSeconds(result.targetMs)}.` },
  ];

  if (result.absDifferenceMs <= 20) {
    messages.push({ tone: "good", text: "That is excellent timing control for a browser-based timing game." });
  } else if (result.early) {
    messages.push({ tone: "info", text: "You were early. Let your count breathe for a fraction longer before stopping." });
  } else {
    messages.push({ tone: "info", text: "You were late. Start your final tap motion slightly before the target moment." });
  }

  return {
    title: "What this means",
    messages,
    tip: rank.id === "miss"
      ? "Use a steady rhythm instead of staring only at the digits. Count the beat, then stop on the mark."
      : "Repeat the same target a few times. Precision improves when the rhythm feels familiar.",
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

export function buildTargetHunterInsight(result: TargetHunterResult, inputMethod?: InputMethod): ResultInsight {
  const rank = getTargetHunterRank(result.score, result.accuracy, result.averageHitMs);
  const messages: InsightMessage[] = [];

  if (result.accuracy >= 90) {
    messages.push({ tone: "good", text: "Strong accuracy. Now try improving your average hit speed without rushing." });
  } else if (result.misses > result.hits * 0.35) {
    messages.push({ tone: "warn", text: "You hit quickly but missed often. Slow down slightly and aim before tapping." });
  } else {
    messages.push({ tone: "info", text: "Target Hunter combines visual detection, aiming, and timing — score is not only raw speed." });
  }

  if (result.longestCombo >= 10) {
    messages.push({ tone: "good", text: `A ${result.longestCombo}-hit combo shows solid focus under pressure.` });
  } else if (result.averageHitMs !== null && result.averageHitMs < 500) {
    messages.push({ tone: "good", text: `Your average hit time was ${formatHitMs(result.averageHitMs)}, which is sharp for a moving pointer task.` });
  }

  return {
    title: "What this means",
    messages,
    tip: rank.id === "rookie"
      ? "Accuracy matters more than panic tapping. Watch the target centre and tap deliberately."
      : "For the next run, keep your eyes near the centre and let peripheral vision catch the next target.",
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

export function buildLevelChallengeInsight(result: LevelChallengeResult, allCompleted = false, inputMethod?: InputMethod): ResultInsight {
  const def = getLevelDef(result.level);
  const messages: InsightMessage[] = [];

  if (allCompleted && result.passed) {
    messages.push({ tone: "good", text: "You cleared the full progression. That mixes speed, accuracy, tracking, and attention control." });
  } else if (result.passed) {
    messages.push({ tone: "good", text: `${def.title} cleared. This level mainly trains ${levelSkillLabel(result.mechanic)}.` });
  } else {
    messages.push({ tone: "warn", text: `${def.title} was not cleared yet. The goal was ${result.requiredHits} hits with controlled mistakes.` });
  }

  if ((result.mechanic === "decoy" || result.mechanic === "elite") && result.wrongTargets > 0) {
    messages.push({ tone: "info", text: "Wrong targets usually mean attention drift. Identify the correct outline/icon before tapping." });
  } else if (result.accuracy >= 90) {
    messages.push({ tone: "good", text: "High accuracy — your taps were controlled, not rushed." });
  }

  if (result.averageHitMs !== null) {
    messages.push({ tone: "info", text: `Average hit time: ${formatLevelMs(result.averageHitMs)} · Score: ${formatLevelScore(result.score)}.` });
  }

  return {
    title: "What this means",
    messages: messages.slice(0, 3),
    tip: result.passed ? def.tip : `${def.tip} Retry once with accuracy as the first goal, then chase speed.`,
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

function levelSkillLabel(mechanic: LevelChallengeResult["mechanic"]): string {
  if (mechanic === "signal") return "basic visual reaction";
  if (mechanic === "fade") return "quick visual detection";
  if (mechanic === "shrink") return "precision under time pressure";
  if (mechanic === "move") return "tracking and coordination";
  if (mechanic === "decoy") return "attention and decoy avoidance";
  return "combined reflex control";
}

export function buildDailyInsight(result: DailyChallengeResult, streak: number, inputMethod?: InputMethod): ResultInsight {
  const rank = getDailyRank(result.score);
  const messages: InsightMessage[] = [
    { tone: result.objectivePassed ? "good" : "info", text: `${formatDailyType(result.challengeType)} daily: ${result.objectivePassed ? "goal passed" : "replay to beat the goal"}.` },
  ];

  if (result.improvedToday) {
    messages.push({ tone: "good", text: "Comeback day — you improved today’s best result on replay." });
  }
  if (streak > 1) {
    messages.push({ tone: "good", text: `Your daily streak is now ${streak}. Small repeat sessions are better than one random result.` });
  } else {
    messages.push({ tone: "info", text: "Daily Challenge is local-only. Come back tomorrow for a new seeded goal." });
  }

  return {
    title: "What this means",
    messages,
    tip: rank.id === "retry"
      ? "Replay once after a short break. Daily goals are designed for practice, not pressure."
      : "Compare today’s score with your own local history rather than treating one day as a final measure.",
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

export function buildLocalBattleInsight(result: LocalBattleResult, inputMethod?: InputMethod): ResultInsight {
  const messages: InsightMessage[] = [];

  if (result.winner === "draw") {
    messages.push({ tone: "info", text: "This was a draw. A rematch is the fairest tie-breaker." });
  } else {
    messages.push({ tone: "good", text: `${result.winnerLabel} won ${formatBattleType(result.battleType)}.` });
  }

  messages.push({ tone: "info", text: `${result.player1Name}: ${describePlayerResult(result.player1Result)}.` });
  messages.push({ tone: "info", text: `${result.player2Name}: ${describePlayerResult(result.player2Result)}.` });

  return {
    title: "What this means",
    messages: messages.slice(0, 3),
    tip: result.battleType === "classic"
      ? "Classic Battle rewards consistency. The fastest single tap does not always win if the average drifts."
      : result.battleType === "precision"
        ? "Precision Battle rewards timing control more than pure speed. Try counting the same rhythm out loud."
        : "Target Hunt Battle balances score, accuracy, combo, and speed. Rushing can lose the match.",
    inputMethod,
    accuracyNote: BROWSER_ACCURACY_NOTE,
  };
}

export function buildLifetimeEducationInsights(stats: ReactionStorageV2): string[] {
  const lines: string[] = [];
  const latest = stats.lastResults[0] ?? null;

  if (latest?.bestMs != null && latest.averageMs != null && latest.averageMs - latest.bestMs >= 40) {
    lines.push(`Latest classic run: your best was ${formatMs(latest.bestMs)}, but your average was ${formatMs(latest.averageMs)} — consistency is the next target.`);
  } else if (latest?.consistency && latest.consistency >= 85) {
    lines.push("Latest classic run: your timings were consistent, which is often more useful than chasing one lucky tap.");
  }

  if (stats.precision.bestAbsDifferenceMs !== null) {
    lines.push(`Precision best: ±${stats.precision.bestAbsDifferenceMs} ms. That mode measures timing control, not pure reflex speed.`);
  }

  if (stats.targetHunter.targetHunterRuns > 0) {
    lines.push(`Target Hunter best: ${formatScore(stats.targetHunter.bestScore)} with ${stats.targetHunter.bestAccuracy}% best accuracy. Accuracy and speed both matter.`);
  }

  if (stats.daily.dailyStreak > 0) {
    lines.push(`Daily routine: ${stats.daily.dailyStreak}-day current streak, stored only in this browser.`);
  }

  return lines.slice(0, 3);
}

export const MODE_EDUCATION_NOTES = [
  {
    title: "Classic Reaction",
    body: "Measures how quickly you respond to a visual signal after waiting. Early taps are separated so guessing does not look like speed.",
  },
  {
    title: "Precision Timer",
    body: "Measures timing control. The goal is not to react instantly, but to stop as close as possible to a target time.",
  },
  {
    title: "Target Hunter",
    body: "Measures visual detection, aiming, accuracy, and hit speed. Rushing can lower the final score if it creates misses.",
  },
  {
    title: "Level Challenge",
    body: "Combines reaction, fading targets, shrinking targets, movement tracking, and decoy avoidance into a progression path.",
  },
  {
    title: "Daily Challenge",
    body: "Gives you a deterministic local goal for the day. It is designed to build a routine without accounts or backend services.",
  },
  {
    title: "Local Battle",
    body: "Compares two local turns on the same device. It is social and local-only, not an online leaderboard.",
  },
] as const;
