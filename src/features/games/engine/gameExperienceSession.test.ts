import { describe, expect, it } from "vitest";
import { calculateActiveSessionDuration, nextSharedBestScore } from "./gameExperienceSession";
import type { GameSessionState } from "./gameExperienceTypes";

const playingSession: GameSessionState = {
  status: "playing",
  startedAt: 1_000,
  pausedAt: null,
  pausedDurationMs: 0,
  result: null,
};

describe("shared game session helpers", () => {
  it("excludes completed and active pause time from play duration", () => {
    expect(calculateActiveSessionDuration({ ...playingSession, pausedDurationMs: 2_000 }, 11_000)).toBe(8_000);
    expect(calculateActiveSessionDuration({ ...playingSession, status: "paused", pausedAt: 8_000, pausedDurationMs: 1_000 }, 11_000)).toBe(6_000);
  });

  it("keeps score records opt-in and larger-is-better", () => {
    expect(nextSharedBestScore(40, { score: 90 })).toBe(40);
    expect(nextSharedBestScore(40, { score: 25, trackBestScore: true })).toBe(40);
    expect(nextSharedBestScore(40, { score: 90, trackBestScore: true })).toBe(90);
    expect(nextSharedBestScore(null, { score: 12, trackBestScore: true })).toBe(12);
  });
});
