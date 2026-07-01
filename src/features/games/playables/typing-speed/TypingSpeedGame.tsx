"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BarChart3, ClipboardCopy, Keyboard, RotateCcw, Sparkles, Timer, Trophy, Zap } from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import { calculateTypingMetrics, createTypingSummary, getDurationMs, getTypingCoachLine, isTypingRoundFinished, selectTypingPrompt } from "./typingSpeedEngine";
import { addTypingHistoryEntry, clearTypingStats, DEFAULT_TYPING_STATS, loadTypingStats, saveTypingStats } from "./typingSpeedStorage";
import type { TypingDifficulty, TypingDuration, TypingMode, TypingSettings, TypingStats } from "./typingSpeedTypes";

const MODE_LABELS: Record<TypingMode, string> = {
  quick: "Quick test",
  practice: "Practice",
  accuracy: "Accuracy",
  challenge: "Challenge",
};

const DIFFICULTY_LABELS: Record<TypingDifficulty, string> = {
  beginner: "Beginner",
  normal: "Normal",
  pro: "Pro text",
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function CharacterStream({ prompt, input }: { prompt: string; input: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 text-lg font-semibold leading-9 tracking-[0.01em] text-[var(--color-text-primary)] sm:text-xl">
      {prompt.split("").map((char, index) => {
        const typed = input[index];
        const current = index === input.length;
        const done = typed !== undefined;
        const correct = done && typed === char;
        return (
          <span
            key={`${char}-${index}`}
            className={[
              "rounded px-0.5 transition",
              current ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--focus-ring)]" : "",
              done && correct ? "text-[var(--color-success-text)]" : "",
              done && !correct ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]" : "",
            ].join(" ")}
          >
            {char === " " ? "·" : char}
          </span>
        );
      })}
    </div>
  );
}

export function TypingSpeedGame({ game }: { game: GameDefinition }) {
  const [settings, setSettings] = useState<TypingSettings>({ mode: "quick", duration: 60, difficulty: "normal" });
  const [promptOffset, setPromptOffset] = useState(0);
  const prompt = useMemo(() => selectTypingPrompt(settings, promptOffset), [promptOffset, settings]);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(1);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState<TypingStats>(DEFAULT_TYPING_STATS);
  const [copied, setCopied] = useState(false);
  const recordedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const metrics = useMemo(() => calculateTypingMetrics(prompt.text, input, elapsedMs), [elapsedMs, input, prompt.text]);
  const remainingSeconds = settings.mode === "practice" ? null : Math.max(0, Math.ceil((getDurationMs(settings.duration) - elapsedMs) / 1000));
  const coachLine = getTypingCoachLine(settings, metrics);

  useEffect(() => setStats(loadTypingStats()), []);

  useEffect(() => {
    if (!startedAt || finished) return;
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 150);
    return () => window.clearInterval(interval);
  }, [finished, startedAt]);

  useEffect(() => {
    if (!startedAt || finished) return;
    if (isTypingRoundFinished(settings, metrics)) {
      setFinished(true);
    }
  }, [finished, metrics, settings, startedAt]);

  useEffect(() => {
    if (!finished || recordedRef.current || input.length === 0) return;
    recordedRef.current = true;
    const entry = {
      ...metrics,
      id: `${Date.now()}`,
      promptId: prompt.id,
      mode: settings.mode,
      duration: settings.duration,
      difficulty: settings.difficulty,
      createdAt: new Date().toISOString(),
    };
    const nextStats = addTypingHistoryEntry(stats, entry);
    setStats(nextStats);
    saveTypingStats(nextStats);
  }, [finished, input.length, metrics, prompt.id, settings.difficulty, settings.duration, settings.mode, stats]);

  const resetRound = useCallback((newPrompt = false) => {
    recordedRef.current = false;
    setInput("");
    setStartedAt(null);
    setElapsedMs(1);
    setFinished(false);
    setCopied(false);
    if (newPrompt) setPromptOffset((value) => value + 1);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  function updateSetting<K extends keyof TypingSettings>(key: K, value: TypingSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    resetRound(true);
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(createTypingSummary(settings, prompt, metrics));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function clearHistory() {
    clearTypingStats();
    setStats(DEFAULT_TYPING_STATS);
  }

  const progressWidth = settings.mode === "practice" ? metrics.progress : Math.min(100, Math.round((elapsedMs / getDurationMs(settings.duration)) * 100));

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-base)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Typing trainer</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">{game.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Measure corrected WPM, raw speed, accuracy, repeated mistakes, and progress in a lightweight browser-only trainer.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft">Best WPM {stats.bestWpm}</Badge>
            <Badge variant="outline">Best accuracy {stats.bestAccuracy}%</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]">Mode<Select value={settings.mode} onChange={(event) => updateSetting("mode", event.target.value as TypingMode)}><option value="quick">Quick test</option><option value="practice">Practice</option><option value="accuracy">Accuracy focus</option><option value="challenge">Challenge</option></Select></label>
          <label className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]">Duration<Select value={settings.duration} disabled={settings.mode === "practice"} onChange={(event) => updateSetting("duration", Number(event.target.value) as TypingDuration)}><option value={15}>15s</option><option value={30}>30s</option><option value={60}>60s</option><option value={120}>120s</option></Select></label>
          <label className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]">Difficulty<Select value={settings.difficulty} onChange={(event) => updateSetting("difficulty", event.target.value as TypingDifficulty)}><option value="beginner">Beginner</option><option value="normal">Normal</option><option value="pro">Pro text</option></Select></label>
          <div className="grid gap-1 text-xs font-bold text-[var(--color-text-secondary)]"><span>Prompt</span><Button variant="secondary" onClick={() => resetRound(true)} leftIcon={<Sparkles className="h-4 w-4" />}>New text</Button></div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px] sm:p-5">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Metric icon={<Zap className="h-4 w-4" />} label="WPM" value={metrics.wpm} />
            <Metric icon={<Keyboard className="h-4 w-4" />} label="Raw WPM" value={metrics.rawWpm} />
            <Metric icon={<Trophy className="h-4 w-4" />} label="Accuracy" value={`${metrics.accuracy}%`} />
            <Metric icon={<Timer className="h-4 w-4" />} label={settings.mode === "practice" ? "Time" : "Left"} value={settings.mode === "practice" ? formatTime(metrics.elapsedSeconds) : formatTime(remainingSeconds ?? 0)} />
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progressWidth}%` }} /></div>

          <CharacterStream prompt={prompt.text} input={input} />

          <textarea
            ref={textareaRef}
            value={input}
            disabled={finished}
            onPaste={(event) => event.preventDefault()}
            onChange={(event) => {
              if (!startedAt) setStartedAt(Date.now());
              setInput(event.target.value.slice(0, prompt.text.length));
            }}
            className="min-h-28 w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] p-4 text-base font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)] disabled:opacity-70"
            placeholder="Start typing here. The timer begins on your first character. Paste is disabled."
            aria-label="Typing input"
          />

          {finished ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4">
              <h3 className="text-lg font-black text-[var(--color-text-primary)]">Round complete</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{coachLine}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => resetRound(false)} leftIcon={<RotateCcw className="h-4 w-4" />}>Try again</Button><Button variant="secondary" onClick={() => resetRound(true)}>New prompt</Button><Button variant="outline" onClick={copyResult} leftIcon={<ClipboardCopy className="h-4 w-4" />}>{copied ? "Copied" : "Copy result"}</Button></div>
            </div>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-sm font-semibold text-[var(--color-text-secondary)]">{coachLine}</p>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <div className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]"><BarChart3 className="h-4 w-4 text-[var(--color-primary)]" /> Session insights</div>
            <dl className="mt-4 grid gap-3 text-sm">
              <Row label="Mode" value={MODE_LABELS[settings.mode]} />
              <Row label="Difficulty" value={DIFFICULTY_LABELS[settings.difficulty]} />
              <Row label="Progress" value={`${metrics.progress}%`} />
              <Row label="Mistakes" value={metrics.incorrectChars} />
              <Row label="Tests saved" value={stats.testsCompleted} />
            </dl>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">Most missed</h3>
            {metrics.mostMissed.length ? <div className="mt-3 flex flex-wrap gap-2">{metrics.mostMissed.map((item) => <Badge key={`${item.expected}-${item.typed}`} variant="outline">{item.expected || "space"} → {item.typed || "blank"} ×{item.count}</Badge>)}</div> : <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Mistake patterns appear while you type.</p>}
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-[var(--color-text-primary)]">Recent history</h3><Button variant="ghost" size="sm" onClick={clearHistory}>Clear</Button></div>
            <div className="mt-3 space-y-2">{stats.history.slice(0, 5).map((entry) => <div key={entry.id} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] p-2 text-xs font-semibold text-[var(--color-text-secondary)]"><span className="font-black text-[var(--color-text-primary)]">{entry.wpm} WPM</span> · {entry.accuracy}% · {entry.mode} · {formatTime(entry.elapsedSeconds)}</div>)}{stats.history.length === 0 ? <p className="text-sm text-[var(--color-text-tertiary)]">Completed rounds save locally here.</p> : null}</div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{icon}{label}</div><div className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">{value}</div></div>;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[var(--color-text-tertiary)]">{label}</dt><dd className="font-black text-[var(--color-text-primary)]">{value}</dd></div>;
}
