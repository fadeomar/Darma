import type { TypingDifficulty, TypingDuration, TypingMetrics, TypingMode, TypingPrompt, TypingSettings } from "./typingSpeedTypes";

export const TYPING_PROMPTS: TypingPrompt[] = [
  {
    id: "focus-1",
    difficulty: "beginner",
    topic: "Focus",
    text: "Small steps build strong habits. Keep your eyes on the next word and type with calm focus.",
  },
  {
    id: "design-1",
    difficulty: "beginner",
    topic: "Design",
    text: "Good design feels clear. A simple layout helps people finish their task without confusion.",
  },
  {
    id: "web-1",
    difficulty: "normal",
    topic: "Web",
    text: "A fast web app should feel responsive, readable, and forgiving on both desktop and mobile screens.",
  },
  {
    id: "product-1",
    difficulty: "normal",
    topic: "Product",
    text: "Professional tools give instant feedback, explain the result, and save useful progress locally when possible.",
  },
  {
    id: "pro-1",
    difficulty: "pro",
    topic: "Advanced",
    text: "Accuracy matters before speed: consistent rhythm, deliberate corrections, and relaxed hands create reliable typing performance.",
  },
  {
    id: "pro-2",
    difficulty: "pro",
    topic: "Challenge",
    text: "Measure raw speed, corrected speed, character accuracy, error clusters, and completion rate to understand real typing quality.",
  },
];

const DIFFICULTY_ORDER: Record<TypingDifficulty, number> = { beginner: 0, normal: 1, pro: 2 };

export function selectTypingPrompt(settings: TypingSettings, offset = 0): TypingPrompt {
  const pool = TYPING_PROMPTS.filter((prompt) => {
    if (settings.mode === "challenge") return DIFFICULTY_ORDER[prompt.difficulty] >= DIFFICULTY_ORDER[settings.difficulty];
    return prompt.difficulty === settings.difficulty;
  });
  const source = pool.length > 0 ? pool : TYPING_PROMPTS;
  const index = Math.abs(`${settings.mode}-${settings.duration}-${settings.difficulty}-${offset}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % source.length;
  return source[index];
}

export function clampTypingInput(input: string, prompt: string): string {
  return input.replace(/\r?\n/g, " ").slice(0, prompt.length);
}

export function calculateTypingMetrics(prompt: string, typedInput: string, elapsedMs: number): TypingMetrics {
  const safeElapsedMs = Math.max(1, elapsedMs);
  const input = clampTypingInput(typedInput, prompt);
  let correctChars = 0;
  let incorrectChars = 0;
  const misses = new Map<string, { expected: string; typed: string; count: number }>();

  for (let index = 0; index < input.length; index += 1) {
    const expected = prompt[index] ?? "";
    const typed = input[index] ?? "";
    if (typed === expected) {
      correctChars += 1;
    } else {
      incorrectChars += 1;
      const key = `${expected}→${typed}`;
      const existing = misses.get(key) ?? { expected, typed, count: 0 };
      existing.count += 1;
      misses.set(key, existing);
    }
  }

  const minutes = safeElapsedMs / 60000;
  const typedChars = input.length;
  const rawWpm = typedChars > 0 ? Math.round((typedChars / 5) / minutes) : 0;
  const wpm = correctChars > 0 ? Math.max(0, Math.round(((correctChars - incorrectChars) / 5) / minutes)) : 0;
  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 1000) / 10 : 100;
  const progress = prompt.length > 0 ? Math.min(100, Math.round((typedChars / prompt.length) * 100)) : 0;

  return {
    elapsedMs: safeElapsedMs,
    elapsedSeconds: Math.round(safeElapsedMs / 1000),
    typedChars,
    correctChars,
    incorrectChars,
    accuracy,
    wpm,
    rawWpm,
    progress,
    completed: input.length >= prompt.length,
    mostMissed: Array.from(misses.values()).sort((a, b) => b.count - a.count).slice(0, 6),
  };
}

export function isTypingRoundFinished(settings: TypingSettings, metrics: TypingMetrics): boolean {
  if (metrics.completed) return true;
  if (settings.mode === "practice") return false;
  return metrics.elapsedSeconds >= settings.duration;
}

export function getTypingCoachLine(settings: TypingSettings, metrics: TypingMetrics): string {
  if (metrics.typedChars === 0) return "Start typing to begin the timer.";
  if (settings.mode === "accuracy" && metrics.accuracy < 98) return "Slow down slightly and protect accuracy before chasing speed.";
  if (metrics.accuracy < 90) return "Accuracy is dropping. Try shorter bursts and correct your rhythm.";
  if (metrics.wpm >= 70 && metrics.accuracy >= 96) return "Excellent speed with strong control.";
  if (metrics.wpm >= 45 && metrics.accuracy >= 94) return "Good pace. Keep a steady rhythm and reduce repeated mistakes.";
  return "Keep typing smoothly. Consistency is more important than rushing.";
}

export function createTypingSummary(settings: TypingSettings, prompt: TypingPrompt, metrics: TypingMetrics): string {
  return [
    "Typing Speed Pro result",
    `Mode: ${settings.mode}`,
    `Difficulty: ${settings.difficulty}`,
    `Prompt: ${prompt.topic}`,
    `WPM: ${metrics.wpm}`,
    `Raw WPM: ${metrics.rawWpm}`,
    `Accuracy: ${metrics.accuracy}%`,
    `Mistakes: ${metrics.incorrectChars}`,
    `Time: ${metrics.elapsedSeconds}s`,
  ].join("\n");
}

export function getDurationMs(duration: TypingDuration): number {
  return duration * 1000;
}
