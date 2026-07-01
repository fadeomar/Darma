"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Eye,
  Gauge,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button, Select } from "@/components/ui";
import type { GameDefinition } from "../../domain/game";
import {
  MEMORY_GRID_COLUMNS,
  createInitialMemoryState,
  flipMemoryCard,
  getMemoryElapsedSeconds,
  hideUnmatchedOpenCards,
  revealHintPair,
  setAllCardsVisible,
  startMemoryGame,
} from "./memoryCardsEngine";
import {
  DEFAULT_MEMORY_STATS,
  clearMemoryStats,
  loadMemoryStats,
  recordMemoryCompletion,
  saveMemoryStats,
} from "./memoryCardsStorage";
import type {
  MemoryDifficulty,
  MemoryState,
  MemoryStats,
  MemoryTheme,
} from "./memoryCardsTypes";
import {
  createSimpleGameAudio,
  type SimpleGameSound,
} from "../shared/simpleGameAudio";

const DIFFICULTY_LABELS: Record<MemoryDifficulty, string> = {
  easy: "Easy 12 cards",
  medium: "Medium 16 cards",
  hard: "Hard 24 cards",
  expert: "Expert 36 cards",
};

const THEME_LABELS: Record<MemoryTheme, string> = {
  icons: "Darma icons",
  animals: "Animals",
  food: "Food",
  sports: "Sports",
};

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function MemoryCardsGame({ game }: { game: GameDefinition }) {
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("medium");
  const [theme, setTheme] = useState<MemoryTheme>("icons");
  const [state, setState] = useState<MemoryState>(() =>
    createInitialMemoryState({ difficulty, theme }),
  );
  const [stats, setStats] = useState<MemoryStats>(DEFAULT_MEMORY_STATS);
  const [tick, setTick] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const recordedRef = useRef(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof createSimpleGameAudio> | null>(
    null,
  );

  useEffect(() => {
    setStats(loadMemoryStats());
    audioRef.current = createSimpleGameAudio();
  }, []);

  const reset = useCallback(
    (nextDifficulty = difficulty, nextTheme = theme) => {
      recordedRef.current = false;
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
      setState(
        createInitialMemoryState({
          difficulty: nextDifficulty,
          theme: nextTheme,
        }),
      );
    },
    [difficulty, theme],
  );

  useEffect(() => {
    reset(difficulty, theme);
  }, [difficulty, reset, theme]);

  useEffect(() => {
    if (state.status !== "playing") return;
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (state.openIds.length !== 2 || state.status === "won") return;
    const openCards = state.cards.filter((card) =>
      state.openIds.includes(card.id),
    );
    if (openCards.every((card) => card.matched)) return;
    hideTimeoutRef.current = window.setTimeout(() => {
      setState((current) => hideUnmatchedOpenCards(current));
    }, 780);
    return () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, [state.cards, state.openIds, state.status]);

  useEffect(() => {
    if (state.status !== "won" || recordedRef.current) return;
    recordedRef.current = true;
    const seconds = getMemoryElapsedSeconds(state, tick);
    const nextStats = recordMemoryCompletion(
      stats,
      state.settings.difficulty,
      state.moves,
      seconds,
      state.mistakes,
      state.matches,
      state.hintsUsed,
    );
    setStats(nextStats);
    saveMemoryStats(nextStats);
  }, [state, stats, tick]);

  function playSound(sound: SimpleGameSound) {
    if (!soundEnabled) return;
    audioRef.current?.unlock();
    audioRef.current?.play(sound);
  }

  function beginPreview() {
    playSound("start");
    const nextStats = { ...stats, gamesStarted: stats.gamesStarted + 1 };
    setStats(nextStats);
    saveMemoryStats(nextStats);
    setState((current) => setAllCardsVisible(current, true));
    window.setTimeout(() => {
      setState((current) =>
        startMemoryGame(setAllCardsVisible(current, false)),
      );
    }, state.settings.previewSeconds * 1000);
  }

  function flip(cardId: string) {
    const baseState = state.status === "ready" ? startMemoryGame(state) : state;
    const next = flipMemoryCard(baseState, cardId);
    if (next !== baseState) {
      if (next.status === "won") playSound("win");
      else if (next.moves > baseState.moves && next.matches > baseState.matches)
        playSound("match");
      else if (
        next.moves > baseState.moves &&
        next.mistakes > baseState.mistakes
      )
        playSound("miss");
      else playSound("flip");
    }
    setState(next);
  }

  function hint() {
    playSound("hint");
    setState((current) => revealHintPair(current));
  }

  function clearStats() {
    clearMemoryStats();
    setStats(DEFAULT_MEMORY_STATS);
  }

  const elapsedSeconds = getMemoryElapsedSeconds(state, tick);
  const progress = Math.round((state.matches / (state.cards.length / 2)) * 100);
  const gridColumns = MEMORY_GRID_COLUMNS[state.settings.difficulty];
  const gridRows = Math.ceil(state.cards.length / gridColumns);
  const boardStyle = {
    "--memory-cols": gridColumns,
    "--memory-rows": gridRows,
    "--memory-card-size": `min(calc((100vw - 28rem) / ${gridColumns}), calc((100dvh - 18rem) / ${gridRows}), 118px)`,
    gridTemplateColumns: `repeat(${gridColumns}, minmax(54px, var(--memory-card-size)))`,
  } as CSSProperties;
  const cardFontStyle = {
    fontSize: "clamp(2rem, calc(var(--memory-card-size) * 0.5), 4.25rem)",
  } as CSSProperties;
  const bestMoves = stats.bestMoves[state.settings.difficulty] ?? "—";
  const bestSeconds = stats.bestSeconds[state.settings.difficulty];
  const performance = useMemo(() => {
    if (state.moves === 0) return "Start matching to get a score.";
    const accuracy = Math.round((state.matches / state.moves) * 100);
    if (accuracy >= 80) return "Excellent memory rhythm.";
    if (accuracy >= 55) return "Good pace. Slow down before risky flips.";
    return "Use the preview or hint to rebuild your map.";
  }, [state.matches, state.moves]);

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]"
      aria-label={`${game.title} playable area`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-primary)]">
            Focus pro build
          </p>
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            Memory Cards Pro
          </h2>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
            A polished concentration game with preview, streaks, hints, stats,
            and difficulty scaling.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">{formatSeconds(elapsedSeconds)}</Badge>
          <Badge variant="outline">Moves {state.moves}</Badge>
          <Badge variant="outline">Progress {progress}%</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)] sm:p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--color-text-primary)]">
                {state.status === "won"
                  ? "Board cleared"
                  : state.status === "preview"
                    ? "Preview mode"
                    : "Match the pairs"}
              </p>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {state.message}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={state.streak > 1 ? "success" : "outline"}>
                Streak x{state.streak}
              </Badge>
              <Badge variant="outline">Mistakes {state.mistakes}</Badge>
            </div>
          </div>

          <div
            className="mx-auto grid max-w-full justify-center gap-2 sm:gap-2.5"
            style={boardStyle}
          >
            {state.cards.map((card) => {
              const visible =
                card.flipped || card.matched || state.status === "preview";
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => flip(card.id)}
                  disabled={
                    card.matched ||
                    state.status === "preview" ||
                    state.openIds.length >= 2
                  }
                  className="relative aspect-square rounded-[var(--radius-md)] outline-none transition focus-visible:shadow-[var(--focus-ring)] disabled:cursor-default"
                  style={{ perspective: "900px" }}
                  aria-label={
                    visible
                      ? `${card.symbol} card${card.matched ? ", matched" : ", open"}`
                      : "Hidden memory card"
                  }
                >
                  <span
                    className="absolute inset-0 rounded-[var(--radius-md)] transition-transform duration-300 ease-out"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: visible ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                    aria-hidden
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[linear-gradient(135deg,var(--color-surface-raised),var(--color-surface-subtle))] text-[var(--color-text-tertiary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-border-strong)]"
                      style={{ backfaceVisibility: "hidden", ...cardFontStyle }}
                    >
                      ◆
                    </span>
                    <span
                      className={`absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] border font-black shadow-[var(--shadow-xs)] ${
                        card.matched
                          ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                          : "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        ...cardFontStyle,
                      }}
                    >
                      {card.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {state.status === "won" && (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-4 text-[var(--color-success-text)]">
              <p className="text-lg font-black">
                You cleared the board in {state.moves} moves.
              </p>
              <p className="mt-1 text-sm leading-6">
                Time {formatSeconds(elapsedSeconds)} · Mistakes {state.mistakes}{" "}
                · Best streak x{state.bestStreak}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
            <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-primary)]">
              <Sparkles
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden
              />{" "}
              Game setup
            </h3>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                Difficulty
                <Select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as MemoryDifficulty)
                  }
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                Theme
                <Select
                  value={theme}
                  onChange={(event) =>
                    setTheme(event.target.value as MemoryTheme)
                  }
                >
                  {Object.entries(THEME_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={beginPreview}
                disabled={state.status === "preview"}
                leftIcon={<Eye className="h-4 w-4" aria-hidden />}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => reset()}
                leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              >
                New
              </Button>
              <Button
                variant="soft"
                onClick={hint}
                disabled={state.status === "won" || state.status === "preview"}
                leftIcon={<Lightbulb className="h-4 w-4" aria-hidden />}
              >
                Hint
              </Button>
              <Button variant="secondary" onClick={clearStats}>
                Clear stats
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSoundEnabled((value) => !value)}
                leftIcon={
                  soundEnabled ? (
                    <Volume2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <VolumeX className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {soundEnabled ? "Sound on" : "Sound off"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Gauge className="h-4 w-4" aria-hidden />}
              label="Best time"
              value={bestSeconds ? formatSeconds(bestSeconds) : "—"}
            />
            <StatCard
              icon={<Target className="h-4 w-4" aria-hidden />}
              label="Best moves"
              value={bestMoves}
            />
            <StatCard
              icon={<Trophy className="h-4 w-4" aria-hidden />}
              label="Perfect"
              value={stats.perfectGames}
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              label="Completed"
              value={stats.gamesCompleted}
            />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
            <h3 className="text-sm font-black text-[var(--color-text-primary)]">
              Performance coach
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {performance}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-subtle)]">
              <div
                className="h-full rounded-[var(--radius-full)] bg-[var(--color-primary)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        {icon}
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
