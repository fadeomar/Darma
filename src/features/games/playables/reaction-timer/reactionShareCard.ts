/**
 * Sprint 11 — local-only share model + client-side PNG result card renderer.
 *
 * The renderer deliberately uses Canvas 2D instead of a DOM screenshot library:
 * no backend, no external service, no heavy dependency, and no account required.
 */

import { formatSeconds, formatSignedMs, getPrecisionRank } from "./precisionScoring";
import { analyzeRun, buildShareText, formatMs } from "./reactionScoring";
import { formatHitMs, formatScore, getTargetHunterRank } from "./targetHunterScoring";
import { formatLevelMs, formatLevelScore, getLevelChallengeRank, getLevelDef } from "./levelChallengeScoring";
import { getDailyRank } from "./dailyChallengeScoring";
import { buildLocalBattleShareText, describePlayerResult, formatBattleType } from "./localBattleScoring";
import type { DailyChallengeResult } from "./dailyChallengeTypes";
import type { LevelChallengeResult } from "./levelChallengeTypes";
import type { LocalBattleResult } from "./localBattleTypes";
import type { PrecisionResult } from "./precisionTypes";
import type { RunSummary } from "./reactionTypes";
import type { TargetHunterResult } from "./targetHunterTypes";

export type ShareResultMode =
  | "classic"
  | "precision"
  | "target-hunter"
  | "level-challenge"
  | "daily"
  | "local-battle";

export type ShareCardMetric = {
  label: string;
  value: string;
};

export type ShareableGameResult = {
  id: string;
  gameTitle: string;
  mode: ShareResultMode;
  modeLabel: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetrics: ShareCardMetric[];
  rankLabel: string;
  score?: number;
  dateLabel: string;
  insight: string;
  achievementsUnlocked?: string[];
  streakLabel?: string;
  playerNames?: string[];
  winnerLabel?: string;
  accuracyNoteShort: string;
  darmaBranding: string;
  routePath: string;
  copyText: string;
};

export type ShareActionKind = "copy" | "download" | "native-share";

const CARD_W = 1200;
const CARD_H = 630;
const CARD_SQUARE = 1080;

const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function nowLabel(dateIso?: string): string {
  const date = dateIso ? new Date(dateIso) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString();
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function clampText(text: string, max = 92): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function safeFilePart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "result";
}

export function filenameForShareResult(result: ShareableGameResult): string {
  const metric = safeFilePart(result.primaryMetricValue.replace(/[+±]/g, ""));
  return `darma-${safeFilePart(result.mode)}-${metric}.png`;
}

export function buildClassicShareResult(input: {
  run: RunSummary;
  previousBestMs?: number | null;
  previousBestAverageMs?: number | null;
  previousRun?: RunSummary | null;
}): ShareableGameResult {
  const analysis = analyzeRun(input.run, input.previousBestMs ?? null, input.previousBestAverageMs ?? null, input.previousRun ?? null);
  return {
    id: `classic-${input.run.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "classic",
    modeLabel: "Classic Reaction",
    primaryMetricLabel: "Best reaction",
    primaryMetricValue: formatMs(input.run.bestMs),
    secondaryMetrics: [
      { label: "Average", value: formatMs(input.run.averageMs) },
      { label: "Accuracy", value: `${input.run.accuracy}%` },
      { label: "Consistency", value: `${input.run.consistency}%` },
      { label: "Early taps", value: `${input.run.earlyPresses}` },
    ],
    rankLabel: analysis.rank.label,
    dateLabel: nowLabel(input.run.createdAt),
    insight: analysis.cleanRun
      ? "Clean focus with no early taps."
      : "Result includes early taps — wait for the visual signal.",
    accuracyNoteShort: "Browser timing can vary by device, display, input, and load.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: buildShareText(input.run),
  };
}

export function buildPrecisionShareResult(result: PrecisionResult): ShareableGameResult {
  const rank = getPrecisionRank(result.absDifferenceMs);
  return {
    id: `precision-${result.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "precision",
    modeLabel: "Precision Timer",
    primaryMetricLabel: "Difference",
    primaryMetricValue: formatSignedMs(result.differenceMs),
    secondaryMetrics: [
      { label: "Target", value: formatSeconds(result.targetMs) },
      { label: "Your stop", value: formatSeconds(result.elapsedMs) },
      { label: "Absolute", value: `±${result.absDifferenceMs} ms` },
    ],
    rankLabel: rank.label,
    dateLabel: nowLabel(result.createdAt),
    insight: result.differenceMs < 0 ? "A little early — let the rhythm reach the mark." : "A little late — count slightly ahead of the target.",
    accuracyNoteShort: "Browser timing can vary by device, display, input, and load.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: `I stopped ${formatSignedMs(result.differenceMs)} from the target in Darma Precision Timer — Rank: ${rank.label}. Can you get closer?`,
  };
}

export function buildTargetHunterShareResult(result: TargetHunterResult): ShareableGameResult {
  const rank = getTargetHunterRank(result.score, result.accuracy, result.averageHitMs);
  return {
    id: `target-${result.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "target-hunter",
    modeLabel: "Target Hunter",
    primaryMetricLabel: "Score",
    primaryMetricValue: formatScore(result.score),
    secondaryMetrics: [
      { label: "Accuracy", value: `${result.accuracy}%` },
      { label: "Combo", value: `${result.longestCombo}` },
      { label: "Avg hit", value: formatHitMs(result.averageHitMs) },
      { label: "Best hit", value: formatHitMs(result.bestHitMs) },
    ],
    rankLabel: rank.label,
    score: result.score,
    dateLabel: nowLabel(result.createdAt),
    insight: result.accuracy >= 85 ? "Strong accuracy — now chase a faster average hit." : "Slow down slightly: accuracy is worth more than rushing.",
    accuracyNoteShort: "Browser timing can vary by device, display, input, and load.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: `I scored ${formatScore(result.score)} in Target Hunter on Darma Reaction Timer Pro — ${result.accuracy}% accuracy and ${result.longestCombo}-hit combo. Can you beat it?`,
  };
}

export function buildLevelChallengeShareResult(result: LevelChallengeResult, allCompleted = false): ShareableGameResult {
  const rank = getLevelChallengeRank(result.passed, result.score, result.accuracy);
  const def = getLevelDef(result.level);
  return {
    id: `level-${result.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "level-challenge",
    modeLabel: allCompleted ? "6-Level Challenge" : `Level ${result.level}: ${def.title}`,
    primaryMetricLabel: result.passed ? "Level cleared" : "Level attempt",
    primaryMetricValue: result.passed ? `Level ${result.level}` : "Try again",
    secondaryMetrics: [
      { label: "Score", value: formatLevelScore(result.score) },
      { label: "Accuracy", value: `${result.accuracy}%` },
      { label: "Avg hit", value: formatLevelMs(result.averageHitMs) },
      { label: "Combo", value: `${result.maxCombo}` },
    ],
    rankLabel: rank.label,
    score: result.score,
    dateLabel: nowLabel(result.createdAt),
    insight: result.mechanic === "decoy" || result.mechanic === "elite"
      ? "This level rewards attention as much as raw speed."
      : "Clear, focused taps beat rushed attempts.",
    accuracyNoteShort: "Browser timing can vary by device, display, input, and load.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: allCompleted
      ? `I completed the 6-level Reflex Challenge on Darma Reaction Timer Pro. Final rank: ${rank.label}.`
      : `I ${result.passed ? "cleared" : "played"} Level ${result.level}: ${def.title} on Darma Reaction Timer Pro — ${result.accuracy}% accuracy, score ${formatLevelScore(result.score)}.`,
  };
}

export function buildDailyShareResult(result: DailyChallengeResult, streak: number): ShareableGameResult {
  const rank = getDailyRank(result.score);
  return {
    id: `daily-${result.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "daily",
    modeLabel: "Daily Challenge",
    primaryMetricLabel: "Daily score",
    primaryMetricValue: `${result.score}`,
    secondaryMetrics: [
      { label: "Challenge", value: result.challengeTitle },
      { label: "Objective", value: result.objectivePassed ? "Passed" : "Replay" },
      { label: "Metric", value: result.primaryMetric },
      { label: "Streak", value: `${streak} days` },
    ],
    rankLabel: rank.label,
    score: result.score,
    dateLabel: result.dateKey,
    insight: result.improvedToday ? "Replay improved today’s best result." : "A local daily routine keeps reflex practice fresh.",
    streakLabel: `${streak} day streak`,
    accuracyNoteShort: "Local daily score is stored only in this browser.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: `I scored ${result.score} on today’s Darma Reaction Timer Pro Daily Challenge — ${result.challengeTitle}. Streak: ${streak} days. Can you beat it?`,
  };
}

export function buildLocalBattleShareResult(result: LocalBattleResult): ShareableGameResult {
  return {
    id: `battle-${result.id}`,
    gameTitle: "Reaction Timer Pro",
    mode: "local-battle",
    modeLabel: `Local Battle · ${formatBattleType(result.battleType)}`,
    primaryMetricLabel: "Winner",
    primaryMetricValue: result.winner === "draw" ? "Draw" : result.winnerLabel,
    secondaryMetrics: [
      { label: result.player1Name, value: describePlayerResult(result.player1Result) },
      { label: result.player2Name, value: describePlayerResult(result.player2Result) },
      { label: "Margin", value: result.marginLabel },
    ],
    rankLabel: result.winner === "draw" ? "Friendly draw" : "Local winner",
    score: result.score,
    dateLabel: nowLabel(result.createdAt),
    insight: result.summary,
    playerNames: [result.player1Name, result.player2Name],
    winnerLabel: result.winnerLabel,
    accuracyNoteShort: "Local battle results stay on this device only.",
    darmaBranding: "Darma Games",
    routePath: "/games/reaction-timer#player",
    copyText: buildLocalBattleShareText(result),
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawLabel(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, w: number): void {
  ctx.save();
  roundRect(ctx, x, y, w, 104, 26);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fill();
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = "#6b7280";
  ctx.fillText(clampText(label, 22), x + 26, y + 34);
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = "#101827";
  ctx.fillText(clampText(value, 22), x + 26, y + 76);
  ctx.restore();
}

export async function renderShareCardBlob(
  result: ShareableGameResult,
  options: { square?: boolean } = {},
): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("Share cards can only be rendered in the browser.");
  const width = options.square ? CARD_SQUARE : CARD_W;
  const height = options.square ? CARD_SQUARE : CARD_H;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available.");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#eef2ff");
  bg.addColorStop(0.52, "#ecfeff");
  bg.addColorStop(1, "#fff7ed");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#6366f1";
  ctx.beginPath();
  ctx.arc(width - 160, 120, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(120, height - 60, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const pad = options.square ? 72 : 64;
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 46);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.08)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = `800 30px ${FONT}`;
  ctx.fillStyle = "#4f46e5";
  ctx.fillText(result.darmaBranding, pad + 44, pad + 62);

  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(`${result.gameTitle} · ${result.modeLabel}`, pad + 44, pad + 98);

  ctx.font = `900 ${options.square ? 52 : 44}px ${FONT}`;
  ctx.fillStyle = "#0f172a";
  ctx.fillText(clampText(result.primaryMetricLabel, 28), pad + 44, pad + 166);

  ctx.font = `900 ${options.square ? 104 : 96}px ${FONT}`;
  ctx.fillStyle = "#111827";
  ctx.fillText(clampText(result.primaryMetricValue, 18), pad + 44, pad + (options.square ? 286 : 280));

  roundRect(ctx, pad + 44, pad + (options.square ? 320 : 312), 300, 60, 30);
  ctx.fillStyle = "#eef2ff";
  ctx.fill();
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = "#3730a3";
  ctx.fillText(clampText(result.rankLabel, 26), pad + 70, pad + (options.square ? 359 : 351));

  const metricY = options.square ? 430 : 420;
  const metricW = options.square ? 440 : 244;
  const cols = options.square ? 2 : 4;
  result.secondaryMetrics.slice(0, options.square ? 4 : 4).forEach((metric, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    drawLabel(ctx, metric.label, metric.value, pad + 44 + col * (metricW + 22), metricY + row * 126, metricW);
  });

  const insightY = options.square ? height - pad - 160 : height - pad - 112;
  ctx.font = `700 27px ${FONT}`;
  ctx.fillStyle = "#0f172a";
  ctx.fillText(clampText(result.insight, options.square ? 68 : 90), pad + 44, insightY);

  ctx.font = `500 21px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(clampText(result.accuracyNoteShort, options.square ? 76 : 96), pad + 44, insightY + 36);

  ctx.font = `700 21px ${FONT}`;
  ctx.fillStyle = "#475569";
  ctx.fillText(`${result.dateLabel} · Browser game · local progress · no signup`, pad + 44, height - pad - 36);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create PNG."));
    }, "image/png", 0.96);
  });
}

export async function renderShareCardDataUrl(result: ShareableGameResult): Promise<string> {
  const blob = await renderShareCardBlob(result);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not preview PNG."));
    reader.readAsDataURL(blob);
  });
}

export async function downloadShareCardPng(result: ShareableGameResult): Promise<void> {
  const blob = await renderShareCardBlob(result);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameForShareResult(result);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
