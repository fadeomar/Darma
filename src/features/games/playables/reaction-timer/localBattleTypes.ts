/**
 * Local Battle (Sprint 9) types.
 *
 * Two players take turns on the same device. Everything stays local-only and
 * account-free; names are optional display labels stored only in localStorage.
 */

import type { TargetHunterResult } from "./targetHunterTypes";

export type LocalBattleType = "classic" | "precision" | "target-hunter";
export type LocalBattlePlayerId = "player1" | "player2";
export type LocalBattleWinner = LocalBattlePlayerId | "draw";

export type LocalBattleClassicPlayerResult = {
  kind: "classic";
  rounds: number[];
  averageMs: number | null;
  bestMs: number | null;
  accuracy: number;
  earlyPresses: number;
  validRounds: number;
};

export type LocalBattlePrecisionPlayerResult = {
  kind: "precision";
  targetMs: number;
  elapsedMs: number;
  differenceMs: number;
  absDifferenceMs: number;
};

export type LocalBattleTargetHunterPlayerResult = {
  kind: "target-hunter";
  targetHunter: TargetHunterResult;
};

export type LocalBattlePlayerResult =
  | LocalBattleClassicPlayerResult
  | LocalBattlePrecisionPlayerResult
  | LocalBattleTargetHunterPlayerResult;

export type LocalBattleResult = {
  id: string;
  battleType: LocalBattleType;
  player1Name: string;
  player2Name: string;
  player1Result: LocalBattlePlayerResult;
  player2Result: LocalBattlePlayerResult;
  winner: LocalBattleWinner;
  winnerLabel: string;
  marginLabel: string;
  summary: string;
  primaryMetric: string;
  secondaryMetric: string;
  score: number;
  rematch: boolean;
  createdAt: string;
};

export type LocalBattleStats = {
  localBattleRuns: number;
  recentBattles: LocalBattleResult[];
  lastWinner: string | null;
  battleWinsByPlayerName: Record<string, number>;
  bestBattleClassicAverage: number | null;
  bestBattlePrecisionDiff: number | null;
  bestBattleTargetScore: number;
  rematchCount: number;
  lastBattlePlayedAt: string | null;
  defaultPlayer1Name: string;
  defaultPlayer2Name: string;
};
