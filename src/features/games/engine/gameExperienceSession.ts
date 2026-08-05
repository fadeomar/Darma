import type { GameSessionResult, GameSessionState } from "./gameExperienceTypes";

/** Return active play time only; paused time is deliberately excluded. */
export function calculateActiveSessionDuration(session: GameSessionState, completedAt: number): number {
  if (session.startedAt === null) return 0;
  const activePause = session.pausedAt === null ? 0 : Math.max(0, completedAt - session.pausedAt);
  return Math.max(0, completedAt - session.startedAt - session.pausedDurationMs - activePause);
}

/** Shared records are opt-in and only support games where a larger score is better. */
export function nextSharedBestScore(currentBest: number | null, result: GameSessionResult): number | null {
  if (!result.trackBestScore || typeof result.score !== "number" || !Number.isFinite(result.score)) return currentBest;
  return currentBest === null ? result.score : Math.max(currentBest, result.score);
}
