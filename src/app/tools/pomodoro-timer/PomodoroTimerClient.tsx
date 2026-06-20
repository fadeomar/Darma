"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { ToolControlPanel, ControlSection, WarningPanel } from "@/features/tools/components";
import { ToolLayoutSingleUtility } from "@/features/tools/layouts";
import {
  formatTime,
  nextPomodoroPhase,
  PHASE_LABEL,
  PHASE_SECONDS,
  SESSIONS_BEFORE_LONG_BREAK,
  type TimerPhase,
} from "./timer";

const PHASES: TimerPhase[] = ["focus", "shortBreak", "longBreak"];

/** Short, dependency-free completion beep via the Web Audio API. */
function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — the visual change is enough.
  }
}

export default function PomodoroTimerClient() {
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [duration, setDuration] = useState(PHASE_SECONDS.focus);
  const [secondsLeft, setSecondsLeft] = useState(PHASE_SECONDS.focus);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const [customMinutes, setCustomMinutes] = useState("25");

  const phaseRef = useRef(phase);
  const completedRef = useRef(completedFocus);
  phaseRef.current = phase;
  completedRef.current = completedFocus;

  // One-second ticker, active only while running.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Handle reaching zero: beep, stop, and advance the Pomodoro cycle.
  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    playBeep();
    setRunning(false);
    const next = nextPomodoroPhase({ phase: phaseRef.current, completedFocus: completedRef.current });
    setPhase(next.phase);
    setCompletedFocus(next.completedFocus);
    setDuration(PHASE_SECONDS[next.phase]);
    setSecondsLeft(PHASE_SECONDS[next.phase]);
  }, [running, secondsLeft]);

  // Reflect the countdown in the tab title while running.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.title;
    if (running) document.title = `${formatTime(secondsLeft)} · ${PHASE_LABEL[phase]} — Darma`;
    return () => {
      document.title = original;
    };
  }, [running, secondsLeft, phase]);

  const selectPhase = useCallback((next: TimerPhase) => {
    setPhase(next);
    setDuration(PHASE_SECONDS[next]);
    setSecondsLeft(PHASE_SECONDS[next]);
    setRunning(false);
  }, []);

  const applyCustom = useCallback(() => {
    const minutes = Number.parseFloat(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    const secs = Math.round(minutes * 60);
    setDuration(secs);
    setSecondsLeft(secs);
    setRunning(false);
  }, [customMinutes]);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(duration);
  }, [duration]);

  const skip = useCallback(() => {
    setRunning(false);
    const next = nextPomodoroPhase({ phase, completedFocus });
    setPhase(next.phase);
    setCompletedFocus(next.completedFocus);
    setDuration(PHASE_SECONDS[next.phase]);
    setSecondsLeft(PHASE_SECONDS[next.phase]);
  }, [phase, completedFocus]);

  const progress = duration > 0 ? Math.min(100, ((duration - secondsLeft) / duration) * 100) : 0;
  const tomatoes = useMemo(() => completedFocus % SESSIONS_BEFORE_LONG_BREAK, [completedFocus]);

  return (
    <ToolLayoutSingleUtility
      resultSlot={
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-6 text-center shadow-[var(--shadow-sm)] sm:p-10">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">{PHASE_LABEL[phase]}</div>
          <div className="mt-3 font-mono text-7xl font-black tabular-nums tracking-tight text-[var(--color-text-primary)] sm:text-8xl">
            {formatTime(secondsLeft)}
          </div>

          <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)]">
            <div className="h-full rounded-[var(--radius-full)] bg-[var(--color-primary)] transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={() => setRunning((value) => !value)}
              disabled={secondsLeft <= 0}
              leftIcon={running ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
            >
              {running ? "Pause" : "Start"}
            </Button>
            <Button size="lg" variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
              Reset
            </Button>
            <Button size="lg" variant="ghost" onClick={skip} leftIcon={<SkipForward className="h-5 w-5" aria-hidden />}>
              Skip
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5" aria-label={`${completedFocus} focus sessions completed`}>
            {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, index) => (
              <span
                key={index}
                className={`h-2.5 w-2.5 rounded-full ${index < tomatoes || (tomatoes === 0 && completedFocus > 0) ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]"}`}
              />
            ))}
            <span className="ml-2 text-xs font-semibold text-[var(--color-text-tertiary)]">{completedFocus} focus done</span>
          </div>
        </section>
      }
      controlsSlot={
        <ToolControlPanel title="Timer" description="Use the Pomodoro presets or set a custom length. The timer runs in your browser and beeps when the time is up.">
          <ControlSection title="Pomodoro presets">
            <div className="flex flex-wrap gap-2">
              {PHASES.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={item === phase && duration === PHASE_SECONDS[item] ? "soft" : "secondary"}
                  aria-pressed={item === phase && duration === PHASE_SECONDS[item]}
                  onClick={() => selectPhase(item)}
                >
                  {PHASE_LABEL[item]} · {PHASE_SECONDS[item] / 60}m
                </Button>
              ))}
            </div>
          </ControlSection>

          <ControlSection title="Custom length">
            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Minutes
                <Input
                  className="mt-1"
                  type="text"
                  inputMode="decimal"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  aria-label="Custom minutes"
                />
              </label>
              <Button size="md" variant="secondary" onClick={applyCustom}>Set</Button>
            </div>
          </ControlSection>
        </ToolControlPanel>
      }
      infoSlot={
        <WarningPanel
          messages={[
            { id: "how", severity: "info", title: "How Pomodoro works", message: "Work in focused 25-minute blocks with short 5-minute breaks, then a longer 15-minute break after four focus sessions." },
            { id: "local", severity: "info", title: "Runs in your browser", message: "Keep this tab open while the timer runs. The countdown also shows in the tab title, and a sound plays when time is up." },
          ]}
        />
      }
    />
  );
}
