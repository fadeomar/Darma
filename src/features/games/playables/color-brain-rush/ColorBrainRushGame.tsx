"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Brain,
  GraduationCap,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { createAmbientMusic } from "../../lib/ambientMusic";
import type { GameDefinition } from "../../domain/game";

type Phase = "start" | "select" | "playing" | "paused" | "win" | "gameOver";
type Mode = "kids" | "classic";
type Difficulty = "beginner" | "intermediate" | "advanced";
type Feedback = "idle" | "correct" | "wrong" | "timeout";

type ColorOption = {
  id: string;
  name: string;
  value: string;
  textClass: string;
};

type DifficultyConfig = {
  label: string;
  subtitle: string;
  colors: ColorOption[];
  seconds: number;
  questions: number;
  passAccuracy: number;
};

type Question = {
  word: ColorOption;
  ink: ColorOption;
  index: number;
  startedAt: number;
};

type Stats = {
  score: number;
  correct: number;
  wrong: number;
  timeouts: number;
  streak: number;
  bestStreak: number;
  totalReactionMs: number;
  answered: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

const COLORS: ColorOption[] = [
  { id: "red", name: "Red", value: "#ef4444", textClass: "text-red-500" },
  { id: "blue", name: "Blue", value: "#3b82f6", textClass: "text-blue-500" },
  { id: "yellow", name: "Yellow", value: "#eab308", textClass: "text-yellow-500" },
  { id: "green", name: "Green", value: "#22c55e", textClass: "text-green-500" },
  { id: "orange", name: "Orange", value: "#f97316", textClass: "text-orange-500" },
  { id: "purple", name: "Purple", value: "#a855f7", textClass: "text-purple-500" },
  { id: "pink", name: "Pink", value: "#ec4899", textClass: "text-pink-500" },
  { id: "black", name: "Black", value: "#111827", textClass: "text-slate-950" },
];

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    label: "Beginner",
    subtitle: "3 basic colors, calm timer, perfect for kids.",
    colors: COLORS.slice(0, 3),
    seconds: 3.5,
    questions: 15,
    passAccuracy: 60,
  },
  intermediate: {
    label: "Intermediate",
    subtitle: "5 common colors with faster decisions.",
    colors: COLORS.slice(0, 5),
    seconds: 2.5,
    questions: 25,
    passAccuracy: 70,
  },
  advanced: {
    label: "Advanced",
    subtitle: "8 known colors and serious focus pressure.",
    colors: COLORS.slice(0, 8),
    seconds: 1.7,
    questions: 35,
    passAccuracy: 80,
  },
};

const EMPTY_STATS: Stats = {
  score: 0,
  correct: 0,
  wrong: 0,
  timeouts: 0,
  streak: 0,
  bestStreak: 0,
  totalReactionMs: 0,
  answered: 0,
};

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function multiplierForStreak(streak: number): number {
  if (streak >= 15) return 5;
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function ratingForAccuracy(accuracy: number): string {
  if (accuracy >= 95) return "Color Master";
  if (accuracy >= 85) return "Excellent";
  if (accuracy >= 70) return "Great Focus";
  if (accuracy >= 50) return "Good Start";
  return "Keep Practicing";
}

function formatMs(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${Math.round(value)}ms`;
}

function createAudio() {
  let ctx: AudioContext | null = null;

  const ensure = () => {
    if (typeof window === "undefined") return null;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!ctx) ctx = new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const music = createAmbientMusic(ensure);

  const tone = (frequency: number, duration: number, type: OscillatorType, gainValue = 0.05, delay = 0) => {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  return {
    unlock() {
      ensure();
    },
    play(event: "start" | "click" | "correct" | "wrong" | "timeout" | "win" | "lose") {
      if (event === "start") {
        tone(392, 0.08, "sine", 0.035);
        tone(523.25, 0.12, "sine", 0.045, 0.08);
      } else if (event === "click") {
        tone(320, 0.05, "triangle", 0.025);
      } else if (event === "correct") {
        tone(523.25, 0.06, "sine", 0.045);
        tone(659.25, 0.08, "sine", 0.05, 0.055);
        tone(783.99, 0.12, "sine", 0.045, 0.11);
      } else if (event === "wrong") {
        tone(180, 0.12, "sawtooth", 0.035);
        tone(120, 0.16, "sawtooth", 0.03, 0.08);
      } else if (event === "timeout") {
        tone(240, 0.12, "square", 0.03);
        tone(180, 0.18, "square", 0.025, 0.11);
      } else if (event === "win") {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, index) => tone(f, 0.11, "sine", 0.045, index * 0.08));
      } else if (event === "lose") {
        [300, 240, 180].forEach((f, index) => tone(f, 0.16, "triangle", 0.035, index * 0.12));
      }
    },
    startBackground() {
      music.start();
    },
    stopBackground() {
      music.stop();
    },
  };
}

function TinyButton({ children, onClick, disabled, className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

export function ColorBrainRushGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("start");
  const [mode, setMode] = useState<Mode>("kids");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [timeLeft, setTimeLeft] = useState(DIFFICULTIES.beginner.seconds);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [feedbackText, setFeedbackText] = useState("Choose the color you see.");
  const [muted, setMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const mutedRef = useRef(false);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);

  const playSound = useCallback((event: "start" | "click" | "correct" | "wrong" | "timeout" | "win" | "lose") => {
    if (!mutedRef.current) audioRef.current?.play(event);
  }, []);

  const config = DIFFICULTIES[difficulty];
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const averageReaction = stats.correct > 0 ? stats.totalReactionMs / stats.correct : 0;
  const multiplier = multiplierForStreak(stats.streak);
  const timerPercent = question ? Math.max(0, Math.min(100, (timeLeft / config.seconds) * 100)) : 100;

  useEffect(() => {
    mutedRef.current = muted;
    if (muted) audioRef.current?.stopBackground();
    else if (phase === "playing") audioRef.current?.startBackground();
  }, [muted, phase]);

  useEffect(() => {
    audioRef.current = createAudio();
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      audioRef.current?.stopBackground();
    };
  }, []);

  const emitParticles = useCallback((kind: "success" | "fail" | "win") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height * 0.45;
    const colors = kind === "fail" ? ["#fb7185", "#f43f5e", "#fecdd3"] : ["#22c55e", "#38bdf8", "#facc15", "#a855f7"];
    const amount = kind === "win" ? 96 : 34;
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = kind === "fail" ? 1.4 + Math.random() * 2.3 : 2 + Math.random() * 4.8;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 120,
        y: kind === "win" ? rect.height * (0.15 + Math.random() * 0.25) : cy + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (kind === "win" ? 1.5 : 0),
        life: 0,
        maxLife: 45 + Math.random() * 35,
        size: 3 + Math.random() * 5,
        color: colors[i % colors.length],
      });
    }
  }, []);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = window.requestAnimationFrame(draw);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      particlesRef.current = particlesRef.current.filter((particle) => particle.life < particle.maxLife);
      for (const particle of particlesRef.current) {
        particle.life += 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.045;
        const alpha = Math.max(0, 1 - particle.life / particle.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = window.requestAnimationFrame(draw);
    };
    rafRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const speakColor = useCallback((colorName: string) => {
    if (!voiceEnabled || mutedRef.current || mode !== "kids" || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(colorName);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [mode, voiceEnabled]);

  const nextQuestion = useCallback(
    (index: number, selectedDifficulty: Difficulty = difficulty) => {
      const colors = DIFFICULTIES[selectedDifficulty].colors;
      const word = pickRandom(colors);
      let ink = pickRandom(colors);
      if (colors.length > 1 && Math.random() < 0.72) {
        let guard = 0;
        while (ink.id === word.id && guard < 8) {
          ink = pickRandom(colors);
          guard += 1;
        }
      }
      const now = Date.now();
      lockRef.current = false;
      setQuestion({ word, ink, index, startedAt: now });
      setTimeLeft(DIFFICULTIES[selectedDifficulty].seconds);
      setFeedback("idle");
      setFeedbackText("Choose the color you see, not the word you read.");
    },
    [difficulty],
  );

  const finishGame = useCallback((finalStats: Stats) => {
    const finalAccuracy = finalStats.answered > 0 ? Math.round((finalStats.correct / finalStats.answered) * 100) : 0;
    const didWin = finalAccuracy >= DIFFICULTIES[difficulty].passAccuracy;
    setQuestion(null);
    setPhase(didWin ? "win" : "gameOver");
    audioRef.current?.stopBackground();
    playSound(didWin ? "win" : "lose");
    emitParticles(didWin ? "win" : "fail");
  }, [difficulty, emitParticles]);

  const scheduleAdvance = useCallback((updatedStats: Stats, currentIndex: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (currentIndex >= DIFFICULTIES[difficulty].questions) {
        finishGame(updatedStats);
      } else {
        nextQuestion(currentIndex + 1);
      }
    }, 780);
  }, [difficulty, finishGame, nextQuestion]);

  const answer = useCallback(
    (color: ColorOption | null, timedOut = false) => {
      if (!question || lockRef.current || phase !== "playing") return;
      lockRef.current = true;
      const isCorrect = !timedOut && color?.id === question.ink.id;
      const reactionMs = Math.max(0, Date.now() - question.startedAt);
      const remainingRatio = Math.max(0, Math.min(1, timeLeft / config.seconds));
      const fastBonus = Math.round(50 * remainingRatio);

      setStats((current) => {
        const nextStreak = isCorrect ? current.streak + 1 : mode === "kids" ? current.streak : 0;
        const nextMultiplier = multiplierForStreak(nextStreak);
        const delta = isCorrect ? Math.round((100 + fastBonus) * nextMultiplier) : mode === "classic" ? -50 : 0;
        const next: Stats = {
          score: Math.max(0, current.score + delta),
          correct: current.correct + (isCorrect ? 1 : 0),
          wrong: current.wrong + (!isCorrect && !timedOut ? 1 : 0),
          timeouts: current.timeouts + (timedOut ? 1 : 0),
          streak: nextStreak,
          bestStreak: Math.max(current.bestStreak, nextStreak),
          totalReactionMs: current.totalReactionMs + (isCorrect ? reactionMs : 0),
          answered: current.answered + 1,
        };
        scheduleAdvance(next, question.index);
        return next;
      });

      if (isCorrect) {
        setFeedback("correct");
        setFeedbackText(mode === "kids" ? `Correct! This color is ${question.ink.name}.` : `Correct +${100 + fastBonus}`);
        playSound("correct");
        emitParticles("success");
        speakColor(question.ink.name);
      } else {
        setFeedback(timedOut ? "timeout" : "wrong");
        setFeedbackText(timedOut ? `Time's up! The color was ${question.ink.name}.` : `Wrong — the visible color was ${question.ink.name}.`);
        playSound(timedOut ? "timeout" : "wrong");
        emitParticles("fail");
        speakColor(question.ink.name);
      }
    },
    [config.seconds, emitParticles, mode, phase, question, scheduleAdvance, speakColor, timeLeft],
  );

  useEffect(() => {
    if (phase !== "playing" || !question || lockRef.current) return;
    let frame = 0;
    const tick = () => {
      const elapsed = (Date.now() - question.startedAt) / 1000;
      const remaining = Math.max(0, config.seconds - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0.01 && !lockRef.current) {
        answer(null, true);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [answer, config.seconds, phase, question]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "playing") return;
      const number = Number(event.key);
      if (!Number.isNaN(number) && number >= 1 && number <= config.colors.length) {
        event.preventDefault();
        answer(config.colors[number - 1]);
      }
      if (event.key.toLowerCase() === "p" || event.key === "Escape") {
        event.preventDefault();
        setPhase("paused");
        audioRef.current?.stopBackground();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, config.colors, phase]);

  const begin = useCallback((selectedDifficulty: Difficulty) => {
    const cfg = DIFFICULTIES[selectedDifficulty];
    audioRef.current?.unlock();
    playSound("start");
    if (!mutedRef.current) audioRef.current?.startBackground();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setDifficulty(selectedDifficulty);
    setStats(EMPTY_STATS);
    setFeedback("idle");
    setFeedbackText("Choose the color you see.");
    setTimeLeft(cfg.seconds);
    setPhase("playing");
    window.setTimeout(() => nextQuestion(1, selectedDifficulty), 0);
  }, [nextQuestion]);

  const resetToMenu = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    audioRef.current?.stopBackground();
    setStats(EMPTY_STATS);
    setQuestion(null);
    setFeedback("idle");
    setFeedbackText("Choose the color you see.");
    setPhase("start");
  }, []);

  const resultPanel = useMemo(() => {
    const didWin = phase === "win";
    return (
      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-4xl flex-col items-center justify-center px-4 py-8 text-center text-white">
        <div className={`inline-flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/20 ${didWin ? "bg-emerald-400/20" : "bg-rose-400/20"}`}>
          {didWin ? <Trophy className="h-10 w-10 text-emerald-200" aria-hidden /> : <XCircle className="h-10 w-10 text-rose-200" aria-hidden />}
        </div>
        <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{didWin ? "Level Complete" : "Game Over"}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
          {didWin ? "Great focus. You matched the visible colors under pressure." : "Close one. Review the visible color first, then answer."}
        </p>
        <div className="mt-6 grid w-full gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Score" value={String(stats.score)} />
          <StatCard label="Accuracy" value={`${accuracy}%`} />
          <StatCard label="Correct" value={String(stats.correct)} />
          <StatCard label="Wrong" value={String(stats.wrong)} />
          <StatCard label="Timeouts" value={String(stats.timeouts)} />
          <StatCard label="Avg. time" value={formatMs(averageReaction)} />
        </div>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 shadow-xl backdrop-blur-md">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white/55">Rating</p>
          <p className="mt-1 text-2xl font-black text-white">{ratingForAccuracy(accuracy)}</p>
          <p className="mt-1 text-xs font-bold text-white/60">Best streak: {stats.bestStreak} · Required to win: {config.passAccuracy}%</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <TinyButton onClick={() => begin(difficulty)} className="bg-white text-slate-950 hover:bg-white/90">
            <RotateCcw className="h-4 w-4" aria-hidden /> Play again
          </TinyButton>
          <TinyButton onClick={() => setPhase("select")}>Change level</TinyButton>
          <TinyButton onClick={() => router.push("/games")}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to games
          </TinyButton>
        </div>
      </div>
    );
  }, [accuracy, averageReaction, begin, config.passAccuracy, difficulty, phase, router, stats]);

  return (
    <section className="relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-slate-950 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.26),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_30%),linear-gradient(135deg,#0f172a,#111827_45%,#312e81)]" aria-hidden />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" aria-hidden />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden />

      {phase === "start" ? (
        <div className="relative z-10 grid min-h-[640px] gap-6 px-4 py-5 text-white lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:p-8">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Educational</Badge>
              <Badge variant="outline">All ages</Badge>
              <Badge variant="accent">No assets needed</Badge>
            </div>
            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">{game.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Choose the color you see, not the word you read. A polished focus challenge that also helps kids learn English color names.
            </p>
            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
              <InfoTile icon={<Brain className="h-5 w-5" aria-hidden />} title="How to play" body="Look at the text color, ignore the written word, then tap the matching color." />
              <InfoTile icon={<Award className="h-5 w-5" aria-hidden />} title="Scoring" body="Correct +100, fast bonus +50, streak multiplier up to x5. Classic mistakes lose 50." />
              <InfoTile icon={<GraduationCap className="h-5 w-5" aria-hidden />} title="Kids mode" body="Friendly feedback, no negative score, optional spoken color names." />
              <InfoTile icon={<Zap className="h-5 w-5" aria-hidden />} title="Challenge mode" body="Timer pressure, reaction stats, accuracy target, and final rating." />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <TinyButton
                onClick={() => {
                  audioRef.current?.unlock();
                  playSound("click");
                  setPhase("select");
                }}
                className="bg-white text-slate-950 hover:bg-white/90"
              >
                <Play className="h-4 w-4" aria-hidden /> Start game
              </TinyButton>
              <TinyButton onClick={() => router.push("/games")}>
                <ArrowLeft className="h-4 w-4" aria-hidden /> Back to games
              </TinyButton>
              <TinyButton onClick={() => setMuted((value) => !value)}>
                {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                {muted ? "Sound off" : "Sound on"}
              </TinyButton>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5 text-center">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Sample round</p>
                <div className="mt-8 rounded-[2rem] border border-white/10 bg-white p-8 shadow-xl">
                  <div className="text-6xl font-black tracking-[-0.08em]" style={{ color: COLORS[1].value, textShadow: "0 2px 0 rgba(15,23,42,.18)" }}>RED</div>
                </div>
                <p className="mt-5 text-sm leading-6 text-white/70">The word says Red, but the visible color is Blue. Correct answer: Blue.</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {COLORS.slice(0, 3).map((color) => (
                    <span key={color.id} className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3 text-xs font-black">
                      <span className="mx-auto mb-1 block h-4 w-4 rounded-full" style={{ background: color.value }} />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "select" ? (
        <div className="relative z-10 min-h-[640px] px-4 py-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TinyButton onClick={() => setPhase("start")}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Menu
            </TinyButton>
            <TinyButton onClick={() => setMuted((value) => !value)}>
              {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            </TinyButton>
          </div>
          <div className="mx-auto mt-8 max-w-5xl text-center">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">Setup</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Choose mode and difficulty</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ModeCard active={mode === "kids"} title="Kids Learning" subtitle="No negative score, friendly feedback, spoken color names." icon={<GraduationCap className="h-6 w-6" aria-hidden />} onClick={() => setMode("kids")} />
              <ModeCard active={mode === "classic"} title="Classic Challenge" subtitle="Timer pressure, penalties, multiplier, full stats." icon={<Zap className="h-6 w-6" aria-hidden />} onClick={() => setMode("classic")} />
            </div>
            {mode === "kids" ? (
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white/80">
                <input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
                Speak correct colors after answers
              </label>
            ) : null}
            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => {
                const item = DIFFICULTIES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => begin(key)}
                    className="group rounded-[1.75rem] border border-white/10 bg-white/10 p-5 text-left shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-white">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-white/65">{item.subtitle}</p>
                      </div>
                      <span className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-950">{item.colors.length}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.colors.map((color) => (
                        <span key={color.id} className="h-7 w-7 rounded-full border-2 border-white/40 shadow-lg" style={{ background: color.value }} title={color.name} />
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black text-white/75">
                      <span className="rounded-2xl bg-black/20 px-2 py-2">{item.seconds}s</span>
                      <span className="rounded-2xl bg-black/20 px-2 py-2">{item.questions} Q</span>
                      <span className="rounded-2xl bg-black/20 px-2 py-2">{item.passAccuracy}% win</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {phase === "playing" || phase === "paused" ? (
        <div className="relative z-10 min-h-[640px] px-3 py-4 text-white sm:px-5 sm:py-5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">{mode === "kids" ? "Kids" : "Classic"}</Badge>
              <Badge variant="outline">{config.label}</Badge>
              <span className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-black text-white/80">Question {question?.index ?? 1}/{config.questions}</span>
            </div>
            <div className="flex items-center gap-2">
              <TinyButton onClick={() => setMuted((value) => !value)} className="min-h-10 px-3">
                {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
              </TinyButton>
              <TinyButton
                onClick={() => {
                  if (phase === "playing") {
                    setPhase("paused");
                    audioRef.current?.stopBackground();
                  } else {
                    setPhase("playing");
                    if (!mutedRef.current) audioRef.current?.startBackground();
                  }
                }}
                className="min-h-10 px-3"
              >
                {phase === "playing" ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {phase === "playing" ? "Pause" : "Resume"}
              </TinyButton>
            </div>
          </div>

          <div className="mx-auto mt-4 grid max-w-6xl gap-3 sm:grid-cols-4">
            <StatCard label="Score" value={String(stats.score)} />
            <StatCard label="Streak" value={String(stats.streak)} />
            <StatCard label="Multiplier" value={`x${multiplier}`} />
            <StatCard label="Accuracy" value={`${accuracy}%`} />
          </div>

          <div className="mx-auto mt-4 h-3 max-w-6xl overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full transition-[width] ${timerPercent < 25 ? "bg-rose-400" : timerPercent < 55 ? "bg-yellow-300" : "bg-emerald-300"}`} style={{ width: `${timerPercent}%` }} />
          </div>

          <div className={`mx-auto mt-5 max-w-3xl rounded-[2rem] border bg-white p-5 text-center shadow-2xl transition ${feedback === "correct" ? "border-emerald-300 ring-4 ring-emerald-300/20" : feedback === "wrong" || feedback === "timeout" ? "animate-[shake_.32s_ease-in-out] border-rose-300 ring-4 ring-rose-300/20" : "border-white/70"}`}>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Visible color is the answer</p>
            <div className="my-6 text-6xl font-black uppercase tracking-[-0.09em] sm:text-8xl" style={{ color: question?.ink.value ?? "#3b82f6", textShadow: question?.ink.id === "yellow" ? "0 3px 0 rgba(15,23,42,.22)" : "0 2px 0 rgba(15,23,42,.10)" }}>
              {question?.word.name ?? "BLUE"}
            </div>
            <p className={`text-sm font-black ${feedback === "correct" ? "text-emerald-600" : feedback === "wrong" || feedback === "timeout" ? "text-rose-600" : "text-slate-500"}`}>{feedbackText}</p>
          </div>

          <div className="mx-auto mt-5 grid max-w-4xl gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {config.colors.map((color, index) => (
              <button
                key={color.id}
                type="button"
                onClick={() => answer(color)}
                disabled={phase !== "playing" || lockRef.current}
                className="group min-h-16 rounded-[1.35rem] border border-white/10 bg-white/12 px-4 py-3 text-left shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full border-2 border-white/60 shadow-lg" style={{ background: color.value }} />
                    <span className="text-base font-black text-white">{color.name}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-white/45">{index + 1}</span>
                </span>
              </button>
            ))}
          </div>

          {phase === "paused" ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
              <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
                <Pause className="mx-auto h-10 w-10 text-white/80" aria-hidden />
                <h3 className="mt-3 text-3xl font-black text-white">Paused</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">Take a breath. Resume when ready.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <TinyButton onClick={() => { setPhase("playing"); if (!mutedRef.current) audioRef.current?.startBackground(); }} className="bg-white text-slate-950 hover:bg-white/90">
                    <Play className="h-4 w-4" aria-hidden /> Resume
                  </TinyButton>
                  <TinyButton onClick={resetToMenu}>Quit</TinyButton>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "win" || phase === "gameOver" ? resultPanel : null}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-7px); }
          50% { transform: translateX(7px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </section>
  );
}

function InfoTile({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">{icon}</span>
        <h3 className="font-black">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
    </div>
  );
}

function ModeCard({ active, title, subtitle, icon, onClick }: { active: boolean; title: string; subtitle: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.75rem] border p-5 text-left shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${active ? "border-cyan-200 bg-cyan-300/20" : "border-white/10 bg-white/10 hover:bg-white/15"}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">{icon}</span>
        <span>
          <span className="block text-lg font-black text-white">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-white/65">{subtitle}</span>
        </span>
      </div>
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center shadow-xl backdrop-blur-md">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
