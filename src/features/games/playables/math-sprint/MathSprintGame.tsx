"use client";

/**
 * Math Sprint — the production player for `/games/math-sprint`.
 *
 * A polished port of the open-source "math-game" (MIT). The arithmetic engine in
 * `mathSprintEngine.ts` is the original logic, converted to TypeScript; this
 * component is an all-new Darma UI: a setup screen, three modes (Practice, Sprint
 * 60s, Kids), a big question card with live timing, an on-screen keypad, immediate
 * correct/wrong feedback, score cards, and a Sprint results screen.
 *
 * localStorage (selected operations, mute, best score/streak) is read only after
 * mount via `mathSprintStorage`, so there is no hydration mismatch.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Check,
  Delete,
  Eraser,
  Flame,
  GraduationCap,
  Hash,
  Keyboard,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import {
  checkResult,
  enabledDifficulties,
  getDefaultDifficulties,
  GROUP_EXAMPLES,
  GROUP_LABELS,
  isGroupEnabled,
  kidsDifficultyMap,
  MAX_ATTEMPTS,
  nextQuestion,
  OPERATION_GROUPS,
  recommendNextDifficulty,
  setGroup,
  SPRINT_SECONDS,
} from "./mathSprintEngine";
import { playMathSprintSound, unlockMathSprintAudio } from "./mathSprintAudio";
import { celebrate } from "./mathSprintConfetti";
import { commitBestSprintScore, commitBestStreak, readState, writeDifficulties, writeMuted } from "./mathSprintStorage";
import type { DifficultyMap, GameMode, OperationGroup, Question, SessionStats } from "./mathSprintTypes";

type Phase = "setup" | "playing" | "over";
type Feedback = "idle" | "correct" | "wrong";

const GROUP_ORDER: OperationGroup[] = ["addition", "subtraction", "multiplication", "division", "advanced"];

const MODES: { id: GameMode; label: string; blurb: string; icon: React.ReactNode }[] = [
  { id: "practice", label: "Practice", blurb: "Unlimited questions. Build speed and accuracy at your own pace.", icon: <Zap className="h-5 w-5" aria-hidden /> },
  { id: "sprint", label: "Sprint", blurb: "60 seconds. Answer as many as you can and chase a high score.", icon: <Timer className="h-5 w-5" aria-hidden /> },
  { id: "kids", label: "Kids", blurb: "Calm pacing, big buttons, simple addition and times tables.", icon: <GraduationCap className="h-5 w-5" aria-hidden /> },
];

const EMPTY_STATS: SessionStats = {
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  totalCorrectTime: 0,
  lastTime: null,
  averageTime: null,
};

function sanitizeInput(raw: string): string {
  // Allow digits, a single decimal separator, and a leading minus. Max 10 chars.
  let out = "";
  let hasDot = false;
  for (let i = 0; i < raw.length && out.length < 10; i += 1) {
    const ch = raw[i];
    if (ch >= "0" && ch <= "9") out += ch;
    else if ((ch === "." || ch === ",") && !hasDot) {
      out += ch;
      hasDot = true;
    } else if (ch === "-" && out.length === 0) out += ch;
  }
  return out;
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "—";
  return `${seconds.toFixed(1)}s`;
}

export function MathSprintGame({ game }: { game: GameDefinition }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<GameMode>("practice");
  const [difficulties, setDifficulties] = useState<DifficultyMap>(() => getDefaultDifficulties());
  const [muted, setMuted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [bestSprintScore, setBestSprintScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const [recommendation, setRecommendation] = useState("");

  const [currentTime, setCurrentTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECONDS);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const questionStartRef = useRef<number>(0);
  const sprintEndRef = useRef<number>(0);
  const lockRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("setup");
  const mutedRef = useRef(false);
  const modeRef = useRef<GameMode>("practice");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Hydrate persisted state after mount (avoids any SSR/client mismatch).
  useEffect(() => {
    const state = readState();
    setDifficulties(state.difficulties);
    setMuted(state.muted);
    setBestSprintScore(state.bestSprintScore);
    setBestStreak(state.bestStreak);
    setHydrated(true);
  }, []);

  const focusInput = useCallback(() => {
    // Autofocus only with a fine pointer (desktop) so mobile keyboards don't pop unexpectedly.
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  const presentQuestion = useCallback((map: DifficultyMap, previous: Question | null) => {
    const next = nextQuestion(map, previous);
    setQuestion(next);
    setInput("");
    setAttempts(0);
    setRevealed(false);
    setFeedback("idle");
    setCurrentTime(0);
    questionStartRef.current = Date.now();
    lockRef.current = false;
    requestAnimationFrame(focusInput);
  }, [focusInput]);

  const endSession = useCallback(() => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    lockRef.current = true;
    phaseRef.current = "over";
    setPhase("over");
    setQuestion(null);

    setStats((finalStats) => {
      const record =
        modeRef.current === "sprint"
          ? finalStats.score > 0 && finalStats.score > bestSprintScore
          : finalStats.bestStreak > 0 && finalStats.bestStreak > bestStreak;

      if (modeRef.current === "sprint") setBestSprintScore(commitBestSprintScore(finalStats.score));
      setBestStreak(commitBestStreak(finalStats.bestStreak));
      setIsRecord(record);
      setRecommendation(recommendNextDifficulty({ correct: finalStats.correct, wrong: finalStats.wrong, averageTime: finalStats.averageTime }));

      playMathSprintSound("finish", mutedRef.current);
      if (record) {
        window.setTimeout(() => playMathSprintSound("newbest", mutedRef.current), 260);
        celebrate("newbest");
      } else if (modeRef.current === "sprint" && finalStats.correct >= 12) {
        celebrate("finish");
      }
      return finalStats;
    });
  }, [bestSprintScore, bestStreak]);

  const startGame = useCallback(
    (nextMode: GameMode) => {
      const map = nextMode === "kids" ? kidsDifficultyMap() : difficulties;
      setMode(nextMode);
      modeRef.current = nextMode;
      setStats(EMPTY_STATS);
      setIsRecord(false);
      setRecommendation("");
      setTimeLeft(SPRINT_SECONDS);
      sprintEndRef.current = Date.now() + SPRINT_SECONDS * 1000;
      phaseRef.current = "playing";
      setPhase("playing");
      unlockMathSprintAudio();
      playMathSprintSound("start", mutedRef.current);
      presentQuestion(map, null);
    },
    [difficulties, presentQuestion],
  );

  const advanceAfter = useCallback(
    (delay: number, map: DifficultyMap, previous: Question | null) => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        if (phaseRef.current !== "playing") return;
        presentQuestion(map, previous);
      }, delay);
    },
    [presentQuestion],
  );

  const submitAnswer = useCallback(() => {
    if (lockRef.current || !question || phase !== "playing") return;
    const trimmed = input.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === ",") return;

    const map = mode === "kids" ? kidsDifficultyMap() : difficulties;
    const correct = checkResult({ difficulty: question.difficulty, x: question.x, y: question.y, result: trimmed });

    if (correct) {
      lockRef.current = true;
      const answerTime = (Date.now() - questionStartRef.current) / 1000;
      setFeedback("correct");
      playMathSprintSound("correct", mutedRef.current);

      setStats((previous) => {
        const streak = previous.streak + 1;
        const correctCount = previous.correct + 1;
        const totalCorrectTime = previous.totalCorrectTime + answerTime;
        const newBestStreak = Math.max(previous.bestStreak, streak);
        // Confetti only on meaningful milestones — never every answer.
        if (streak > 0 && streak % 10 === 0) celebrate("milestone");
        return {
          ...previous,
          score: previous.score + question.points,
          correct: correctCount,
          streak,
          bestStreak: newBestStreak,
          totalCorrectTime,
          lastTime: answerTime,
          averageTime: totalCorrectTime / correctCount,
        };
      });

      advanceAfter(mode === "kids" ? 650 : 380, map, question);
      return;
    }

    // Wrong answer — gentle feedback, streak breaks.
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setFeedback("wrong");
    playMathSprintSound("wrong", mutedRef.current);
    setStats((previous) => (previous.streak === 0 ? previous : { ...previous, streak: 0 }));

    if (nextAttempts >= MAX_ATTEMPTS) {
      // Reveal the answer, count the question as missed, then move on.
      lockRef.current = true;
      setRevealed(true);
      setStats((previous) => ({ ...previous, wrong: previous.wrong + 1 }));
      advanceAfter(1500, map, question);
    } else {
      setInput("");
      window.setTimeout(() => setFeedback("idle"), 420);
      focusInput();
    }
  }, [advanceAfter, attempts, difficulties, focusInput, input, mode, phase, question]);

  // Live "current question" timer.
  useEffect(() => {
    if (phase !== "playing" || feedback !== "idle") return;
    const id = window.setInterval(() => {
      setCurrentTime((Date.now() - questionStartRef.current) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, feedback, question]);

  // Sprint countdown.
  useEffect(() => {
    if (phase !== "playing" || mode !== "sprint") return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, (sprintEndRef.current - Date.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        endSession();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, mode, endSession]);

  // Keyboard: Enter to submit while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitAnswer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, submitAnswer]);

  // Cleanup timers on unmount.
  useEffect(() => () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeMuted(next);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group: OperationGroup) => {
    setDifficulties((current) => {
      const enabled = isGroupEnabled(current, group);
      const next = setGroup(current, group, !enabled);
      writeDifficulties(next);
      return next;
    });
  }, []);

  const appendChar = useCallback((ch: string) => {
    setInput((value) => sanitizeInput(value + ch));
    setFeedback((f) => (f === "wrong" ? "idle" : f));
  }, []);
  const backspace = useCallback(() => setInput((value) => value.slice(0, -1)), []);
  const clearInput = useCallback(() => setInput(""), []);

  const enabledCount = useMemo(() => enabledDifficulties(difficulties).length, [difficulties]);
  const enabledGroupSymbols = useMemo(
    () => GROUP_ORDER.filter((g) => OPERATION_GROUPS[g].some((d) => difficulties[d])).map((g) => GROUP_LABELS[g]),
    [difficulties],
  );

  const kidsMode = mode === "kids";
  const displayBestScore = hydrated ? bestSprintScore : 0;
  const displayBestStreak = hydrated ? bestStreak : 0;

  return (
    <div className={cn("dmsp-shell", kidsMode && phase === "playing" && "dmsp-shell--kids")}>
      <div className="dmsp-topbar">
        <div className="dmsp-topbar-id">
          <span className="dmsp-eyebrow">Mental maths</span>
          <h2 className="dmsp-topbar-title">{game.title}</h2>
        </div>
        <div className="dmsp-topbar-controls">
          <Badge variant="soft">{mode === "sprint" ? "Sprint 60s" : mode === "kids" ? "Kids" : "Practice"}</Badge>
          {mode === "sprint" ? <Badge variant="outline">Best {displayBestScore}</Badge> : <Badge variant="outline">Best streak {displayBestStreak}</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            aria-pressed={muted}
            leftIcon={muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          >
            {muted ? "Muted" : "Sound"}
          </Button>
          {phase === "playing" ? (
            <Button variant="secondary" size="sm" onClick={endSession} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              End
            </Button>
          ) : null}
        </div>
      </div>

      <div className="dmsp-stage">
        {phase === "setup" ? (
          <SetupScreen
            mode={mode}
            onModeChange={setMode}
            difficulties={difficulties}
            onToggleGroup={toggleGroup}
            bestScore={displayBestScore}
            bestStreak={displayBestStreak}
            enabledCount={enabledCount}
            onStart={() => startGame(mode)}
          />
        ) : phase === "playing" ? (
          <PlayScreen
            mode={mode}
            question={question}
            input={input}
            feedback={feedback}
            revealed={revealed}
            attempts={attempts}
            stats={stats}
            currentTime={currentTime}
            timeLeft={timeLeft}
            bestScore={displayBestScore}
            bestStreak={displayBestStreak}
            enabledGroupSymbols={enabledGroupSymbols}
            inputRef={inputRef}
            onInputChange={(value) => {
              setInput(sanitizeInput(value));
              setFeedback((f) => (f === "wrong" ? "idle" : f));
            }}
            onSubmit={submitAnswer}
            onAppend={appendChar}
            onBackspace={backspace}
            onClear={clearInput}
          />
        ) : (
          <ResultsScreen
            mode={mode}
            stats={stats}
            isRecord={isRecord}
            recommendation={recommendation}
            bestScore={displayBestScore}
            bestStreak={displayBestStreak}
            onPlayAgain={() => startGame(mode)}
            onChangeSetup={() => {
              phaseRef.current = "setup";
              setPhase("setup");
            }}
          />
        )}
      </div>

      <div className="dmsp-guide">
        <span className="dmsp-guide-title">
          <Keyboard className="h-4 w-4" aria-hidden /> How to play
        </span>
        <span>Type your answer and press Enter (or use the keypad), then go again. Decimals accept a dot or comma. Your best score and streak are saved on this device.</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Setup screen                                                             */
/* ----------------------------------------------------------------------- */

function SetupScreen({
  mode,
  onModeChange,
  difficulties,
  onToggleGroup,
  bestScore,
  bestStreak,
  enabledCount,
  onStart,
}: {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  difficulties: DifficultyMap;
  onToggleGroup: (group: OperationGroup) => void;
  bestScore: number;
  bestStreak: number;
  enabledCount: number;
  onStart: () => void;
}) {
  const kids = mode === "kids";
  return (
    <div className="dmsp-setup">
      <div className="dmsp-setup-head">
        <span className="dmsp-panel-kicker"><Sparkles className="h-4 w-4" aria-hidden /> New session</span>
        <h3>Fast arithmetic, your way</h3>
        <p>Pick a mode and the operations you want to drill. Great for kids, students, and anyone keeping their mental maths sharp.</p>
      </div>

      <div className="dmsp-mode-grid" role="group" aria-label="Choose a mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cn("dmsp-mode-card", mode === m.id && "dmsp-mode-card--active")}
            aria-pressed={mode === m.id}
            onClick={() => onModeChange(m.id)}
          >
            <span className="dmsp-mode-icon">{m.icon}</span>
            <strong>{m.label}</strong>
            <span className="dmsp-mode-blurb">{m.blurb}</span>
          </button>
        ))}
      </div>

      <div className="dmsp-ops">
        <div className="dmsp-ops-head">
          <span className="dmsp-panel-kicker"><Settings2 className="h-4 w-4" aria-hidden /> Operations</span>
          {kids ? <span className="dmsp-ops-note">Kids mode uses simple addition and times tables.</span> : <span className="dmsp-ops-note">{enabledCount} selected — at least one stays on.</span>}
        </div>
        <div className={cn("dmsp-ops-grid", kids && "dmsp-ops-grid--locked")}>
          {GROUP_ORDER.map((group) => {
            const on = isGroupEnabled(difficulties, group);
            return (
              <button
                key={group}
                type="button"
                className={cn("dmsp-op-toggle", on && "dmsp-op-toggle--on")}
                aria-pressed={on}
                disabled={kids}
                onClick={() => onToggleGroup(group)}
              >
                <span className="dmsp-op-check" aria-hidden>{on ? <Check className="h-4 w-4" /> : null}</span>
                <span className="dmsp-op-label">{GROUP_LABELS[group]}</span>
                <span className="dmsp-op-example">{GROUP_EXAMPLES[group]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dmsp-setup-footer">
        <div className="dmsp-setup-bests">
          <span><Trophy className="h-4 w-4" aria-hidden /> Best score {bestScore}</span>
          <span><Flame className="h-4 w-4" aria-hidden /> Best streak {bestStreak}</span>
        </div>
        <Button size="lg" onClick={onStart} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
          {mode === "sprint" ? "Start 60-second sprint" : mode === "kids" ? "Start kids practice" : "Start practice"}
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Play screen                                                              */
/* ----------------------------------------------------------------------- */

const KEYPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "-", "0", "."];

function PlayScreen({
  mode,
  question,
  input,
  feedback,
  revealed,
  attempts,
  stats,
  currentTime,
  timeLeft,
  bestScore,
  bestStreak,
  enabledGroupSymbols,
  inputRef,
  onInputChange,
  onSubmit,
  onAppend,
  onBackspace,
  onClear,
}: {
  mode: GameMode;
  question: Question | null;
  input: string;
  feedback: Feedback;
  revealed: boolean;
  attempts: number;
  stats: SessionStats;
  currentTime: number;
  timeLeft: number;
  bestScore: number;
  bestStreak: number;
  enabledGroupSymbols: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAppend: (ch: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}) {
  if (!question) return null;

  return (
    <div className="dmsp-play">
      <div className="dmsp-play-main">
        <div className="dmsp-status-row">
          {mode === "sprint" ? (
            <div className={cn("dmsp-timer", timeLeft <= 10 && "dmsp-timer--low")}>
              <Timer className="h-4 w-4" aria-hidden />
              <span>{Math.ceil(timeLeft)}s</span>
            </div>
          ) : (
            <div className="dmsp-timer">
              <Hash className="h-4 w-4" aria-hidden />
              <span>{stats.correct + stats.wrong + 1}</span>
            </div>
          )}
          <div className="dmsp-status-streak" aria-label={`Streak ${stats.streak}`}>
            <Flame className={cn("h-4 w-4", stats.streak >= 3 && "dmsp-flame-hot")} aria-hidden />
            <span>{stats.streak}</span>
          </div>
          <div className="dmsp-status-time">
            <Timer className="h-4 w-4" aria-hidden /> {currentTime.toFixed(1)}s
          </div>
        </div>

        <div
          className={cn(
            "dmsp-question-card",
            feedback === "correct" && "dmsp-question-card--correct",
            feedback === "wrong" && "dmsp-question-card--wrong",
          )}
          aria-live="polite"
        >
          <div className="dmsp-question" aria-label={`${question.x} ${question.operator} ${question.y}`}>
            <span className="dmsp-operand">{question.x.toString()}</span>
            <span className="dmsp-operator">{question.operator}</span>
            <span className="dmsp-operand">{question.y.toString()}</span>
            <span className="dmsp-equals">=</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            className="dmsp-answer"
            value={revealed ? question.answer.toString() : input}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onInputChange(event.target.value)}
            placeholder="?"
            aria-label="Your answer"
            autoComplete="off"
            spellCheck={false}
            maxLength={10}
            readOnly={revealed}
          />

          {revealed ? (
            <p className="dmsp-reveal">The answer was <strong>{question.answer.toString()}</strong>. Here comes the next one…</p>
          ) : feedback === "wrong" ? (
            <p className="dmsp-hint dmsp-hint--wrong">Not quite — try again{attempts >= 1 ? ` (${MAX_ATTEMPTS - attempts} left)` : ""}.</p>
          ) : (
            <p className="dmsp-hint">Type your answer, then press Enter.</p>
          )}
        </div>

        <div className={cn("dmsp-keypad", mode === "kids" && "dmsp-keypad--big")} aria-hidden={false}>
          {KEYPAD_KEYS.map((key) => (
            <button key={key} type="button" className="dmsp-key" onClick={() => onAppend(key)} aria-label={`Enter ${key}`}>
              {key}
            </button>
          ))}
          <button type="button" className="dmsp-key dmsp-key--util" onClick={onBackspace} aria-label="Backspace">
            <Delete className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" className="dmsp-key dmsp-key--util" onClick={onClear} aria-label="Clear">
            <Eraser className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" className="dmsp-key dmsp-key--submit" onClick={onSubmit} aria-label="Submit answer">
            <Check className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <aside className="dmsp-side" aria-label="Session stats">
        <div className="dmsp-stat-grid">
          <StatCard icon={<Star className="h-4 w-4" aria-hidden />} label="Score" value={stats.score} highlight />
          <StatCard icon={<Flame className="h-4 w-4" aria-hidden />} label="Streak" value={stats.streak} />
          <StatCard icon={<Timer className="h-4 w-4" aria-hidden />} label="Avg time" value={formatTime(stats.averageTime)} small />
          <StatCard icon={<Timer className="h-4 w-4" aria-hidden />} label="Last" value={formatTime(stats.lastTime)} small />
          <StatCard icon={<Trophy className="h-4 w-4" aria-hidden />} label="Best" value={mode === "sprint" ? bestScore : bestStreak} />
          <StatCard icon={<Check className="h-4 w-4" aria-hidden />} label="Correct" value={stats.correct} />
        </div>
        <div className="dmsp-panel-card">
          <span className="dmsp-panel-kicker"><Settings2 className="h-4 w-4" aria-hidden /> Operations</span>
          <div className="dmsp-op-chips">
            {enabledGroupSymbols.length > 0 ? enabledGroupSymbols.map((label) => <span key={label} className="dmsp-op-chip">{label}</span>) : <span className="dmsp-op-chip">—</span>}
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatCard({ icon, label, value, highlight, small }: { icon: React.ReactNode; label: string; value: React.ReactNode; highlight?: boolean; small?: boolean }) {
  return (
    <div className={cn("dmsp-stat", highlight && "dmsp-stat--highlight")}>
      <span className="dmsp-stat-label">{icon} {label}</span>
      <span className={cn("dmsp-stat-value", small && "dmsp-stat-value--sm")}>{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Results screen                                                           */
/* ----------------------------------------------------------------------- */

function ResultsScreen({
  mode,
  stats,
  isRecord,
  recommendation,
  bestScore,
  bestStreak,
  onPlayAgain,
  onChangeSetup,
}: {
  mode: GameMode;
  stats: SessionStats;
  isRecord: boolean;
  recommendation: string;
  bestScore: number;
  bestStreak: number;
  onPlayAgain: () => void;
  onChangeSetup: () => void;
}) {
  const total = stats.correct + stats.wrong;
  const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
  return (
    <div className="dmsp-results" role="status" aria-live="polite">
      <div className="dmsp-results-head">
        <span className="dmsp-panel-kicker"><Trophy className="h-4 w-4" aria-hidden /> {mode === "sprint" ? "Time! Sprint complete" : "Session summary"}</span>
        <h3>{mode === "sprint" ? `You scored ${stats.score}` : `Great practice!`}</h3>
        {isRecord ? <span className="dmsp-record"><Trophy className="h-4 w-4" aria-hidden /> New personal best!</span> : null}
      </div>

      <div className="dmsp-results-grid">
        <StatCard icon={<Star className="h-4 w-4" aria-hidden />} label="Score" value={stats.score} highlight />
        <StatCard icon={<Check className="h-4 w-4" aria-hidden />} label="Correct" value={stats.correct} />
        <StatCard icon={<Hash className="h-4 w-4" aria-hidden />} label="Accuracy" value={`${accuracy}%`} small />
        <StatCard icon={<Flame className="h-4 w-4" aria-hidden />} label="Best streak" value={stats.bestStreak} />
        <StatCard icon={<Timer className="h-4 w-4" aria-hidden />} label="Avg time" value={formatTime(stats.averageTime)} small />
        <StatCard icon={<Trophy className="h-4 w-4" aria-hidden />} label={mode === "sprint" ? "Best score" : "Best streak"} value={mode === "sprint" ? bestScore : bestStreak} />
      </div>

      {recommendation ? (
        <div className="dmsp-reco">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>{recommendation}</span>
        </div>
      ) : null}

      <div className="dmsp-results-actions">
        <Button size="lg" onClick={onPlayAgain} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
          Play again
        </Button>
        <Button size="lg" variant="outline" onClick={onChangeSetup} leftIcon={<Settings2 className="h-5 w-5" aria-hidden />}>
          Change setup
        </Button>
      </div>
    </div>
  );
}
