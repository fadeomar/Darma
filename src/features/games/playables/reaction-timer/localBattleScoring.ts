/** Pure scoring/comparison helpers for Local Battle mode. */

import { formatSignedMs } from "./precisionScoring";
import { formatMs, makeId } from "./reactionScoring";
import { formatScore } from "./targetHunterScoring";
import type {
  LocalBattleClassicPlayerResult,
  LocalBattlePlayerResult,
  LocalBattlePrecisionPlayerResult,
  LocalBattleResult,
  LocalBattleTargetHunterPlayerResult,
  LocalBattleType,
  LocalBattleWinner,
} from "./localBattleTypes";
import type { TargetHunterResult } from "./targetHunterTypes";

export const LOCAL_BATTLE_CLASSIC_ROUNDS = 5;
export const LOCAL_BATTLE_PRECISION_TARGET_MS = 5000;

export function formatBattleType(type: LocalBattleType): string {
  if (type === "classic") return "Classic Battle";
  if (type === "precision") return "Precision Battle";
  return "Target Hunt Battle";
}

export function sanitizeBattleName(name: string | undefined, fallback: string): string {
  const value = (name ?? "").trim().slice(0, 24);
  return value || fallback;
}

export function buildClassicBattlePlayerResult(rounds: number[], earlyPresses: number): LocalBattleClassicPlayerResult {
  const safeRounds = rounds.filter((n) => Number.isFinite(n) && n >= 0).map(Math.round);
  const attempts = safeRounds.length + Math.max(0, Math.floor(earlyPresses));
  return {
    kind: "classic",
    rounds: safeRounds,
    averageMs: safeRounds.length ? Math.round(safeRounds.reduce((sum, t) => sum + t, 0) / safeRounds.length) : null,
    bestMs: safeRounds.length ? Math.min(...safeRounds) : null,
    accuracy: attempts > 0 ? Math.round((safeRounds.length / attempts) * 100) : 0,
    earlyPresses: Math.max(0, Math.floor(earlyPresses)),
    validRounds: safeRounds.length,
  };
}

export function buildPrecisionBattlePlayerResult(targetMs: number, elapsedMs: number): LocalBattlePrecisionPlayerResult {
  const safeElapsed = Math.max(0, Math.round(elapsedMs));
  const differenceMs = safeElapsed - targetMs;
  return {
    kind: "precision",
    targetMs,
    elapsedMs: safeElapsed,
    differenceMs,
    absDifferenceMs: Math.abs(differenceMs),
  };
}

export function buildTargetBattlePlayerResult(result: TargetHunterResult): LocalBattleTargetHunterPlayerResult {
  return { kind: "target-hunter", targetHunter: result };
}

function compareClassic(a: LocalBattleClassicPlayerResult, b: LocalBattleClassicPlayerResult): LocalBattleWinner {
  const aAvg = a.averageMs ?? Number.POSITIVE_INFINITY;
  const bAvg = b.averageMs ?? Number.POSITIVE_INFINITY;
  if (aAvg !== bAvg) return aAvg < bAvg ? "player1" : "player2";
  const aBest = a.bestMs ?? Number.POSITIVE_INFINITY;
  const bBest = b.bestMs ?? Number.POSITIVE_INFINITY;
  if (aBest !== bBest) return aBest < bBest ? "player1" : "player2";
  if (a.earlyPresses !== b.earlyPresses) return a.earlyPresses < b.earlyPresses ? "player1" : "player2";
  return "draw";
}

function comparePrecision(a: LocalBattlePrecisionPlayerResult, b: LocalBattlePrecisionPlayerResult): LocalBattleWinner {
  if (a.absDifferenceMs !== b.absDifferenceMs) return a.absDifferenceMs < b.absDifferenceMs ? "player1" : "player2";
  return "draw";
}

function compareTarget(a: LocalBattleTargetHunterPlayerResult, b: LocalBattleTargetHunterPlayerResult): LocalBattleWinner {
  if (a.targetHunter.score !== b.targetHunter.score) return a.targetHunter.score > b.targetHunter.score ? "player1" : "player2";
  if (a.targetHunter.accuracy !== b.targetHunter.accuracy) return a.targetHunter.accuracy > b.targetHunter.accuracy ? "player1" : "player2";
  const aAvg = a.targetHunter.averageHitMs ?? Number.POSITIVE_INFINITY;
  const bAvg = b.targetHunter.averageHitMs ?? Number.POSITIVE_INFINITY;
  if (aAvg !== bAvg) return aAvg < bAvg ? "player1" : "player2";
  return "draw";
}

function resultMetric(result: LocalBattlePlayerResult): string {
  if (result.kind === "classic") return `${formatMs(result.averageMs)} avg`;
  if (result.kind === "precision") return `${formatSignedMs(result.differenceMs)} from target`;
  return `${formatScore(result.targetHunter.score)} pts`;
}

function battleScore(type: LocalBattleType, winner: LocalBattleWinner, p1: LocalBattlePlayerResult, p2: LocalBattlePlayerResult): number {
  if (type === "classic" && p1.kind === "classic" && p2.kind === "classic") {
    const winnerResult = winner === "player2" ? p2 : p1;
    const avg = winnerResult.averageMs ?? 700;
    return Math.max(0, Math.round(1000 - avg + winnerResult.accuracy * 2 - winnerResult.earlyPresses * 25));
  }
  if (type === "precision" && p1.kind === "precision" && p2.kind === "precision") {
    const winnerResult = winner === "player2" ? p2 : p1;
    return Math.max(0, 1000 - winnerResult.absDifferenceMs * 3);
  }
  if (type === "target-hunter" && p1.kind === "target-hunter" && p2.kind === "target-hunter") {
    return Math.max(p1.targetHunter.score, p2.targetHunter.score);
  }
  return 0;
}

export function finalizeLocalBattle(input: {
  battleType: LocalBattleType;
  player1Name: string;
  player2Name: string;
  player1Result: LocalBattlePlayerResult;
  player2Result: LocalBattlePlayerResult;
  rematch?: boolean;
}): LocalBattleResult {
  const player1Name = sanitizeBattleName(input.player1Name, "Player 1");
  const player2Name = sanitizeBattleName(input.player2Name, "Player 2");
  const { player1Result, player2Result, battleType } = input;

  let winner: LocalBattleWinner = "draw";
  if (battleType === "classic" && player1Result.kind === "classic" && player2Result.kind === "classic") {
    winner = compareClassic(player1Result, player2Result);
  } else if (battleType === "precision" && player1Result.kind === "precision" && player2Result.kind === "precision") {
    winner = comparePrecision(player1Result, player2Result);
  } else if (battleType === "target-hunter" && player1Result.kind === "target-hunter" && player2Result.kind === "target-hunter") {
    winner = compareTarget(player1Result, player2Result);
  }

  const winnerLabel = winner === "draw" ? "Draw" : winner === "player1" ? player1Name : player2Name;
  let marginLabel = "Even match";
  if (battleType === "classic" && player1Result.kind === "classic" && player2Result.kind === "classic") {
    const a = player1Result.averageMs ?? 0;
    const b = player2Result.averageMs ?? 0;
    marginLabel = winner === "draw" ? "A perfect tie" : `${Math.abs(a - b)} ms average gap`;
  } else if (battleType === "precision" && player1Result.kind === "precision" && player2Result.kind === "precision") {
    marginLabel = winner === "draw" ? "A perfect tie" : `${Math.abs(player1Result.absDifferenceMs - player2Result.absDifferenceMs)} ms closer`;
  } else if (battleType === "target-hunter" && player1Result.kind === "target-hunter" && player2Result.kind === "target-hunter") {
    marginLabel = winner === "draw" ? "A perfect tie" : `${Math.abs(player1Result.targetHunter.score - player2Result.targetHunter.score)} point gap`;
  }

  const primaryMetric = winner === "draw" ? "Draw" : `${winnerLabel} wins`;
  const secondaryMetric = `${player1Name}: ${resultMetric(player1Result)} · ${player2Name}: ${resultMetric(player2Result)}`;
  const summary = winner === "draw"
    ? `${player1Name} and ${player2Name} tied in ${formatBattleType(battleType)}.`
    : `${winnerLabel} wins ${formatBattleType(battleType)} — ${marginLabel}.`;

  return {
    id: makeId(),
    battleType,
    player1Name,
    player2Name,
    player1Result,
    player2Result,
    winner,
    winnerLabel,
    marginLabel,
    summary,
    primaryMetric,
    secondaryMetric,
    score: battleScore(battleType, winner, player1Result, player2Result),
    rematch: Boolean(input.rematch),
    createdAt: new Date().toISOString(),
  };
}

export function buildLocalBattleShareText(result: LocalBattleResult): string {
  if (result.battleType === "classic") {
    return `Local Battle on Darma Reaction Timer Pro: ${result.summary}`;
  }
  if (result.battleType === "precision") {
    return `Local Battle on Darma Reaction Timer Pro: ${result.summary}`;
  }
  if (result.battleType === "target-hunter" && result.player1Result.kind === "target-hunter" && result.player2Result.kind === "target-hunter") {
    const winnerRun = result.winner === "player2" ? result.player2Result.targetHunter : result.player1Result.targetHunter;
    if (result.winner !== "draw") return `Local Battle on Darma Reaction Timer Pro: ${result.winnerLabel} won Target Hunt with ${formatScore(winnerRun.score)} points and ${winnerRun.accuracy}% accuracy.`;
  }
  return `Local Battle on Darma Reaction Timer Pro: ${result.summary}`;
}

export function localBattlePrimaryValue(result: LocalBattleResult): string {
  return result.winner === "draw" ? "Draw" : result.winnerLabel;
}

export function describePlayerResult(result: LocalBattlePlayerResult): string {
  if (result.kind === "classic") {
    return `Avg ${formatMs(result.averageMs)} · Best ${formatMs(result.bestMs)} · ${result.accuracy}% accuracy`;
  }
  if (result.kind === "precision") {
    return `Target ${(result.targetMs / 1000).toFixed(3)}s · ${formatSignedMs(result.differenceMs)} · ${result.absDifferenceMs} ms off`;
  }
  return `${formatScore(result.targetHunter.score)} pts · ${result.targetHunter.accuracy}% · combo ${result.targetHunter.longestCombo}`;
}
