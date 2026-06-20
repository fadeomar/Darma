import { describe, expect, it } from "vitest";
import { formatTime, minutesRemaining, nextPomodoroPhase, PHASE_SECONDS } from "./timer";

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(25 * 60)).toBe("25:00");
  });
  it("adds hours past 3600 seconds", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });
  it("clamps negatives and non-finite values to zero", () => {
    expect(formatTime(-10)).toBe("00:00");
    expect(formatTime(Number.NaN)).toBe("00:00");
  });
});

describe("nextPomodoroPhase", () => {
  it("goes focus -> short break for the first three sessions", () => {
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 0 })).toEqual({ phase: "shortBreak", completedFocus: 1 });
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 1 })).toEqual({ phase: "shortBreak", completedFocus: 2 });
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 2 })).toEqual({ phase: "shortBreak", completedFocus: 3 });
  });

  it("goes focus -> long break on the fourth session", () => {
    expect(nextPomodoroPhase({ phase: "focus", completedFocus: 3 })).toEqual({ phase: "longBreak", completedFocus: 4 });
  });

  it("returns to focus after any break without changing the count", () => {
    expect(nextPomodoroPhase({ phase: "shortBreak", completedFocus: 2 })).toEqual({ phase: "focus", completedFocus: 2 });
    expect(nextPomodoroPhase({ phase: "longBreak", completedFocus: 4 })).toEqual({ phase: "focus", completedFocus: 4 });
  });
});

describe("PHASE_SECONDS", () => {
  it("uses the classic 25/5/15 durations", () => {
    expect(PHASE_SECONDS.focus).toBe(1500);
    expect(PHASE_SECONDS.shortBreak).toBe(300);
    expect(PHASE_SECONDS.longBreak).toBe(900);
  });
});

describe("minutesRemaining", () => {
  it("rounds up to whole minutes", () => {
    expect(minutesRemaining(0)).toBe(0);
    expect(minutesRemaining(1)).toBe(1);
    expect(minutesRemaining(60)).toBe(1);
    expect(minutesRemaining(61)).toBe(2);
  });
});
