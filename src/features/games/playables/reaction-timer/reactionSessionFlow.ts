export type SessionFlowTone = "info" | "success" | "warning";

export type SessionFlowStepStatus = "done" | "active" | "next";

export type SessionFlowStep = {
  label: string;
  status: SessionFlowStepStatus;
};

export type SessionFlowCopy = {
  title: string;
  description: string;
  steps: SessionFlowStep[];
  tone?: SessionFlowTone;
};

export function classicRoundFlow({
  validCount,
  totalRounds,
  autoAdvance,
}: {
  validCount: number;
  totalRounds: number;
  autoAdvance: boolean;
}): SessionFlowCopy {
  const remaining = Math.max(0, totalRounds - validCount);
  return {
    title: remaining > 0 ? "Round saved" : "Final summary next",
    description:
      remaining > 0
        ? autoAdvance
          ? "The next round starts automatically. You can also continue immediately."
          : "Auto-advance is off, so continue when you are ready."
        : "Your full run summary is ready next.",
    steps: [
      { label: "React", status: "done" },
      { label: "Review", status: "active" },
      { label: remaining > 0 ? `${remaining} round${remaining === 1 ? "" : "s"} left` : "Summary", status: "next" },
    ],
    tone: "info",
  };
}

export function classicFinalFlow(isFirstRun: boolean): SessionFlowCopy {
  return {
    title: isFirstRun ? "Baseline saved" : "Choose your next move",
    description: isFirstRun
      ? "Replay Classic to compare against your baseline, or try Practice before advanced modes."
      : "Replay while your rhythm is fresh, warm up in Practice, or return to modes for a different challenge.",
    steps: [
      { label: "Run complete", status: "done" },
      { label: "Insights", status: "active" },
      { label: "Replay or mode switch", status: "next" },
    ],
    tone: isFirstRun ? "success" : "info",
  };
}

export function precisionResultFlow(isBest: boolean): SessionFlowCopy {
  return {
    title: isBest ? "New precision mark" : "Refine the rhythm",
    description: isBest
      ? "Try the same target again while the timing is fresh, or switch targets for a new rhythm."
      : "Precision improves through rhythm. Retry the same target before changing modes.",
    steps: [
      { label: "Target set", status: "done" },
      { label: "Stop measured", status: "done" },
      { label: "Retry target", status: "next" },
    ],
    tone: isBest ? "success" : "info",
  };
}

export function targetHunterResultFlow(isBest: boolean): SessionFlowCopy {
  return {
    title: isBest ? "Score locked in" : "One more hunt?",
    description: isBest
      ? "Great run. Replay now to defend the new score, or go back to modes for a different challenge."
      : "A quick replay usually helps: keep accuracy first, then speed up target by target.",
    steps: [
      { label: "30s hunt", status: "done" },
      { label: "Score review", status: "active" },
      { label: "Replay or switch", status: "next" },
    ],
    tone: isBest ? "success" : "info",
  };
}

export function levelResultFlow({
  passed,
  hasNextLevel,
  allCompleted,
}: {
  passed: boolean;
  hasNextLevel: boolean;
  allCompleted: boolean;
}): SessionFlowCopy {
  if (allCompleted && passed) {
    return {
      title: "Full challenge cleared",
      description: "You completed the six-level path. Replay from Level 1 to chase a stronger total score.",
      steps: [
        { label: "Level 6", status: "done" },
        { label: "Challenge complete", status: "active" },
        { label: "Replay path", status: "next" },
      ],
      tone: "success",
    };
  }

  return {
    title: passed ? (hasNextLevel ? "Next level unlocked" : "Level cleared") : "Retry with a cleaner plan",
    description: passed
      ? hasNextLevel
        ? "Move forward while the mechanic is fresh, or replay this level to improve the score."
        : "Replay this level to improve the score, or return to the mode lobby."
      : "No progress lost. Retry the same level and focus on the goal condition first.",
    steps: [
      { label: "Attempt", status: "done" },
      { label: passed ? "Passed" : "Review goal", status: "active" },
      { label: passed && hasNextLevel ? "Next level" : "Retry", status: "next" },
    ],
    tone: passed ? "success" : "warning",
  };
}

export function dailyResultFlow({
  isNewBest,
  objectivePassed,
}: {
  isNewBest: boolean;
  objectivePassed: boolean;
}): SessionFlowCopy {
  return {
    title: isNewBest ? "Best daily result saved" : objectivePassed ? "Daily completed" : "Replay to beat the goal",
    description: isNewBest
      ? "Your streak is safe for today. Replays can still improve today’s best score."
      : objectivePassed
        ? "Same-day replays will not add extra streak days, but they can improve your best."
        : "The streak attempt is saved only after completion. Replay today’s challenge to improve the result.",
    steps: [
      { label: "Today’s seed", status: "done" },
      { label: "Result saved", status: objectivePassed ? "done" : "active" },
      { label: "Replay or share", status: "next" },
    ],
    tone: isNewBest || objectivePassed ? "success" : "warning",
  };
}

export function battleResultFlow(isDraw: boolean): SessionFlowCopy {
  return {
    title: isDraw ? "Tie breaker recommended" : "Winner declared",
    description: isDraw
      ? "Run a rematch with the same settings for a clean tie breaker."
      : "Rematch keeps the same battle type and player names, so you can settle it quickly.",
    steps: [
      { label: "Player 1", status: "done" },
      { label: "Player 2", status: "done" },
      { label: isDraw ? "Rematch" : "Result", status: "next" },
    ],
    tone: isDraw ? "warning" : "success",
  };
}
