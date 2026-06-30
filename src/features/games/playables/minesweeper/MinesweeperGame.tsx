"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import {
  DEFAULT_MINESWEEPER_CONFIG,
  MINESWEEPER_DIFFICULTIES,
  computeMinesweeperScore,
  countCorrectFlags,
  countRevealedSafeCells,
  createMinesweeperModel,
  formatMinesweeperTime,
  revealMinesweeperCell,
  toggleMinesweeperFlag,
} from "./minesweeperEngine";
import { playMinesweeperSound, unlockMinesweeperAudio } from "./minesweeperAudio";
import { commitMinesweeperResult, readMinesweeperState, writeMinesweeperMuted, type MinesweeperBest } from "./minesweeperStorage";
import type { MinesweeperCell, MinesweeperConfig, MinesweeperDifficultyId, MinesweeperModel } from "./minesweeperTypes";

type FlagIntent = "normal" | "flag";

const CLASSIC_GRAY = "#c0c0c3";
const CLASSIC_DARK = "#808080";
const CLASSIC_RED = "#ea3323";
const CLASSIC_FONT = '"Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const NUMBER_COLORS: Record<number, string> = {
  1: "#0100f3",
  2: "#367c21",
  3: "#e93323",
  4: "#020079",
  5: "#78150e",
  6: "#387e7e",
  7: "#000000",
  8: "#808080",
};

function getConfigById(id: MinesweeperDifficultyId): MinesweeperConfig {
  return MINESWEEPER_DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DEFAULT_MINESWEEPER_CONFIG;
}

function getElapsedSeconds(model: MinesweeperModel, liveElapsed: number): number {
  if (model.finishedAt && model.startedAt) return Math.max(0, Math.floor((model.finishedAt - model.startedAt) / 1000));
  return liveElapsed;
}

function emptyBest(): MinesweeperBest {
  return { bestScore: 0, bestTime: null, wins: 0, played: 0 };
}

function formatDigitalNumber(value: number, digits = 3): string {
  const capped = Math.max(0, Math.min(10 ** digits - 1, Math.floor(value)));
  return capped.toString().padStart(digits, "0");
}

function classicOutsetStyle(extra?: CSSProperties): CSSProperties {
  return {
    border: "2px solid",
    borderColor: "#fff #808080 #808080 #fff",
    background: CLASSIC_GRAY,
    boxSizing: "border-box",
    ...extra,
  };
}

function classicInsetStyle(extra?: CSSProperties): CSSProperties {
  return {
    border: "2px solid",
    borderColor: "#808080 #fff #fff #808080",
    background: CLASSIC_GRAY,
    boxSizing: "border-box",
    ...extra,
  };
}

function ClassicDisplay({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase leading-none text-[#333]" style={{ fontFamily: CLASSIC_FONT }}>
        {label}
      </span>
      <span
        className={cn("inline-flex h-[28px] items-center justify-end bg-black px-2 text-right text-[18px] font-black leading-none text-[#ea3323]", wide ? "min-w-[82px]" : "min-w-[54px]")}
        style={{ fontFamily: CLASSIC_FONT, letterSpacing: "0.04em" }}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
    </div>
  );
}

function ClassicControlButton({ children, active = false, onClick, ariaLabel }: { children: ReactNode; active?: boolean; onClick: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      className="min-h-[34px] px-3 text-xs font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={active ? classicInsetStyle({ background: "#d8d8dc", fontFamily: CLASSIC_FONT }) : classicOutsetStyle({ fontFamily: CLASSIC_FONT })}
    >
      {children}
    </button>
  );
}

function ClassicSelect({ value, onChange }: { value: MinesweeperDifficultyId; onChange: (value: MinesweeperDifficultyId) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-black" style={{ fontFamily: CLASSIC_FONT }}>
      Size
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as MinesweeperDifficultyId)}
        className="h-[34px] min-w-[150px] bg-[#c0c0c3] px-2 text-xs font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}
        aria-label="Choose board size"
      >
        {MINESWEEPER_DIFFICULTIES.map((difficulty) => (
          <option key={difficulty.id} value={difficulty.id}>
            {difficulty.label} ({difficulty.cols}×{difficulty.rows})
          </option>
        ))}
      </select>
    </label>
  );
}

function SmileyButton({ phase, onClick }: { phase: MinesweeperModel["phase"]; onClick: () => void }) {
  const face = phase === "won" ? "😎" : phase === "lost" ? "😵‍💫" : "🙂";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[34px] w-[34px] items-center justify-center p-0 text-[22px] leading-none outline-none active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={classicOutsetStyle()}
      aria-label="New game"
      title="New game"
    >
      {face}
    </button>
  );
}

function CellButton({
  cell,
  disabled,
  lastCol,
  lastRow,
  onReveal,
  onFlag,
}: {
  cell: MinesweeperCell;
  disabled: boolean;
  lastCol: boolean;
  lastRow: boolean;
  onReveal: (intent?: FlagIntent) => void;
  onFlag: () => void;
}) {
  const longPressRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" || disabled || cell.revealed) return;
      longPressedRef.current = false;
      clearLongPress();
      longPressRef.current = window.setTimeout(() => {
        longPressedRef.current = true;
        onFlag();
      }, 430);
    },
    [cell.revealed, clearLongPress, disabled, onFlag],
  );

  const handlePointerUp = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleClick = useCallback(() => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onReveal();
  }, [onReveal]);

  const content = (() => {
    if (cell.wrongFlag) return "❌";
    if (cell.flagged && !cell.revealed) return "🚩";
    if (!cell.revealed) return "";
    if (cell.mine) return "💣";
    if (cell.adjacent > 0) return cell.adjacent;
    return "";
  })();

  const cellStyle: CSSProperties = cell.revealed || cell.wrongFlag
    ? {
        width: 26,
        height: 26,
        padding: 0,
        borderStyle: "solid",
        borderColor: CLASSIC_DARK,
        borderWidth: `1px ${lastCol ? "1px" : "0"} ${lastRow ? "1px" : "0"} 1px`,
        background: cell.exploded ? CLASSIC_RED : CLASSIC_GRAY,
        color: cell.adjacent > 0 ? NUMBER_COLORS[cell.adjacent] : "#000",
        fontFamily: CLASSIC_FONT,
        fontSize: cell.mine || cell.wrongFlag ? 15 : 16,
        fontWeight: 900,
        lineHeight: "24px",
        textAlign: "center",
        boxSizing: "border-box",
      }
    : {
        width: 26,
        height: 26,
        padding: 0,
        border: "2px solid",
        borderColor: "#fff #808080 #808080 #fff",
        background: CLASSIC_GRAY,
        color: "#000",
        fontFamily: CLASSIC_FONT,
        fontSize: 15,
        fontWeight: 900,
        lineHeight: "22px",
        textAlign: "center",
        boxSizing: "border-box",
      };

  return (
    <button
      type="button"
      disabled={disabled || cell.revealed || cell.wrongFlag}
      onClick={handleClick}
      onContextMenu={(event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onFlag();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="block select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-default"
      style={cellStyle}
      aria-label={
        cell.revealed
          ? cell.mine
            ? "Mine"
            : cell.adjacent > 0
              ? `${cell.adjacent} nearby mines`
              : "Empty safe cell"
          : cell.wrongFlag
            ? "Wrong flag"
            : cell.flagged
              ? "Flagged cell"
              : "Hidden cell"
      }
    >
      {content}
    </button>
  );
}

function ClassicBoard({
  model,
  config,
  elapsed,
  score,
  flagMode,
  muted,
  onNewGame,
  onFlagMode,
  onMute,
  onReveal,
  onFlag,
}: {
  model: MinesweeperModel;
  config: MinesweeperConfig;
  elapsed: number;
  score: number;
  flagMode: boolean;
  muted: boolean;
  onNewGame: () => void;
  onFlagMode: () => void;
  onMute: () => void;
  onReveal: (row: number, col: number, intent?: FlagIntent) => void;
  onFlag: (row: number, col: number) => void;
}) {
  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${config.cols}, 26px)`,
    gridAutoRows: "26px",
    touchAction: "manipulation",
  };

  return (
    <div className="inline-block p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)]" style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}>
      <div className="mb-[5px] flex items-center justify-between gap-3 p-1" style={classicInsetStyle()}>
        <ClassicDisplay label="Mines" value={formatDigitalNumber(model.flagsLeft)} />
        <SmileyButton phase={model.phase} onClick={onNewGame} />
        <ClassicDisplay label="Score" value={formatDigitalNumber(score, 5)} wide />
        <ClassicDisplay label="Time" value={formatDigitalNumber(elapsed)} />
      </div>

      <div className="mb-[5px] flex flex-wrap items-center justify-center gap-2 p-1" style={classicInsetStyle()}>
        <ClassicControlButton active={flagMode} onClick={onFlagMode} ariaLabel="Toggle flag mode">
          🚩 {flagMode ? "Flag mode" : "Reveal mode"}
        </ClassicControlButton>
        <ClassicControlButton active={muted} onClick={onMute} ariaLabel="Toggle sound">
          {muted ? "🔇 Muted" : "🔊 Sound"}
        </ClassicControlButton>
      </div>

      <div className="flex justify-center">
        <div className="inline-grid select-none overflow-hidden" style={{ ...classicInsetStyle(), ...gridStyle }} aria-label={`${config.label} Minesweeper board`}>
          {model.board.map((row) =>
            row.map((cell) => (
              <CellButton
                key={cell.id}
                cell={cell}
                disabled={model.phase !== "playing"}
                lastCol={cell.col === config.cols - 1}
                lastRow={cell.row === config.rows - 1}
                onReveal={(intent) => onReveal(cell.row, cell.col, intent)}
                onFlag={() => onFlag(cell.row, cell.col)}
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}

function StartPanel({ gameTitle, config, best, difficultyId, muted, onSelectDifficulty, onStart, onMute }: {
  gameTitle: string;
  config: MinesweeperConfig;
  best: MinesweeperBest;
  difficultyId: MinesweeperDifficultyId;
  muted: boolean;
  onSelectDifficulty: (id: MinesweeperDifficultyId) => void;
  onStart: () => void;
  onMute: () => void;
}) {
  return (
    <div className="mx-auto inline-block max-w-full p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)]" style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}>
      <div className="p-3" style={classicInsetStyle({ minWidth: 320, maxWidth: 520 })}>
        <div className="flex items-center justify-between gap-3">
          <ClassicDisplay label="Mines" value={formatDigitalNumber(config.mines)} />
          <div className="flex h-[42px] w-[42px] items-center justify-center text-[28px]" style={classicOutsetStyle()} aria-hidden>
            🙂
          </div>
          <ClassicDisplay label="Best" value={formatDigitalNumber(best.bestScore, 5)} wide />
        </div>
        <div className="mt-5 text-center">
          <h2 className="text-2xl font-black leading-tight text-black">{gameTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[#333]">
            Same classic Minesweeper look, now rebuilt in React with fair first click, score, sound, and mobile flagging.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ClassicSelect value={difficultyId} onChange={onSelectDifficulty} />
          <ClassicControlButton active={muted} onClick={onMute} ariaLabel="Toggle sound">
            {muted ? "🔇 Muted" : "🔊 Sound"}
          </ClassicControlButton>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-black">
          <div className="p-2" style={classicInsetStyle()}>
            <div>Grid</div>
            <div className="mt-1 text-sm">{config.cols}×{config.rows}</div>
          </div>
          <div className="p-2" style={classicInsetStyle()}>
            <div>Mines</div>
            <div className="mt-1 text-sm">{config.mines}</div>
          </div>
          <div className="p-2" style={classicInsetStyle()}>
            <div>Best time</div>
            <div className="mt-1 text-sm">{best.bestTime === null ? "---" : formatMinesweeperTime(best.bestTime)}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onStart}
            className="min-h-[42px] min-w-[150px] px-5 text-sm font-black text-black outline-none active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultOverlay({
  phase,
  score,
  elapsed,
  safeRevealed,
  totalSafe,
  moves,
  correctFlags,
  mines,
  onPlayAgain,
  onStartScreen,
  onClose,
}: {
  phase: "won" | "lost";
  score: number;
  elapsed: number;
  safeRevealed: number;
  totalSafe: number;
  moves: number;
  correctFlags: number;
  mines: number;
  onPlayAgain: () => void;
  onStartScreen: () => void;
  onClose: () => void;
}) {
  const won = phase === "won";
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-black/25 p-2">
      <div className="relative w-[min(94%,260px)] p-1 text-center shadow-[0_18px_45px_rgba(0,0,0,0.28)]" style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close and view the board"
          title="View the board"
          className="absolute right-1 top-1 z-10 flex h-[20px] w-[20px] items-center justify-center text-[11px] font-black leading-none text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}
        >
          ✕
        </button>
        <div className="p-2" style={classicInsetStyle()}>
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-[26px] w-[26px] items-center justify-center text-[18px]" style={classicOutsetStyle()} aria-hidden>
              {won ? "😎" : "😵‍💫"}
            </div>
            <h3 className="text-base font-black leading-none text-black">{won ? "YOU WIN!" : "GAME OVER"}</h3>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-bold leading-none text-black">
            <div className="p-1" style={classicInsetStyle()}>
              <div className="text-[#333]">Score</div>
              <div className="mt-1 text-sm text-[#ea3323]">{formatDigitalNumber(score, 5)}</div>
            </div>
            <div className="p-1" style={classicInsetStyle()}>
              <div className="text-[#333]">Time</div>
              <div className="mt-1 text-sm text-[#ea3323]">{formatMinesweeperTime(elapsed)}</div>
            </div>
            <div className="p-1" style={classicInsetStyle()}>
              <div className="text-[#333]">Moves</div>
              <div className="mt-1 text-sm">{moves}</div>
            </div>
            <div className="p-1" style={classicInsetStyle()}>
              <div className="text-[#333]">Safe</div>
              <div className="mt-1 text-sm">{safeRevealed}/{totalSafe}</div>
            </div>
            <div className="col-span-2 p-1" style={classicInsetStyle()}>
              <div className="text-[#333]">Flags</div>
              <div className="mt-1 text-sm">{correctFlags}/{mines}</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            <ClassicControlButton onClick={onPlayAgain}>Play again</ClassicControlButton>
            <ClassicControlButton onClick={onStartScreen}>Start screen</ClassicControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructionPanel({ showInstructions, onToggle }: { showInstructions: boolean; onToggle: () => void }) {
  return (
    <div className="w-full max-w-[380px] p-1" style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}>
      <div className="p-3 text-black" style={classicInsetStyle()}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left text-sm font-black text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          {showInstructions ? "▼" : "▶"} Instructions
        </button>
        {showInstructions ? (
          <div className="mt-3 space-y-3 text-xs font-bold leading-5 text-[#333]">
            <p><strong>Reveal:</strong> click or tap a hidden square. Numbers show how many mines touch that square.</p>
            <p><strong>Flag:</strong> right-click on desktop, use Flag mode, or long-press on mobile.</p>
            <p><strong>Goal:</strong> reveal every safe cell without touching a mine.</p>
            <p><strong>Tip:</strong> if a number touches the same number of flags, nearby unflagged cells are safe.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MinesweeperGame({ game }: { game: GameDefinition }) {
  const [difficultyId, setDifficultyId] = useState<MinesweeperDifficultyId>("classic");
  const config = useMemo(() => getConfigById(difficultyId), [difficultyId]);
  const [model, setModel] = useState<MinesweeperModel>(() => createMinesweeperModel(DEFAULT_MINESWEEPER_CONFIG));
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [bestByDifficulty, setBestByDifficulty] = useState<Record<MinesweeperDifficultyId, MinesweeperBest>>({
    easy: emptyBest(),
    classic: emptyBest(),
    expert: emptyBest(),
  });
  const savedResultKeyRef = useRef<string | null>(null);
  const [resultClosed, setResultClosed] = useState(false);

  useEffect(() => {
    const saved = readMinesweeperState();
    setMuted(saved.muted);
    setBestByDifficulty(saved.bestByDifficulty);
  }, []);

  useEffect(() => {
    if (model.phase !== "playing" || !model.startedAt) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - model.startedAt!) / 1000)));
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [model.phase, model.startedAt]);

  const finalElapsed = getElapsedSeconds(model, elapsed);
  const score = computeMinesweeperScore(model, config, finalElapsed);
  const safeRevealed = countRevealedSafeCells(model, config);
  const totalSafe = config.rows * config.cols - config.mines;
  const correctFlags = countCorrectFlags(model);
  const currentBest = bestByDifficulty[difficultyId] ?? emptyBest();

  useEffect(() => {
    if (model.phase !== "won" && model.phase !== "lost") return;
    const resultKey = `${model.phase}-${difficultyId}-${model.finishedAt ?? 0}`;
    if (savedResultKeyRef.current === resultKey) return;
    savedResultKeyRef.current = resultKey;

    const saved = commitMinesweeperResult({
      difficulty: difficultyId,
      won: model.phase === "won",
      score,
      elapsed: finalElapsed,
    });
    setBestByDifficulty(saved.bestByDifficulty);
  }, [difficultyId, finalElapsed, model.finishedAt, model.phase, score]);

  const startRound = useCallback(
    (nextDifficulty: MinesweeperDifficultyId = difficultyId) => {
      const nextConfig = getConfigById(nextDifficulty);
      unlockMinesweeperAudio();
      playMinesweeperSound("start", muted);
      savedResultKeyRef.current = null;
      setDifficultyId(nextDifficulty);
      setModel(createMinesweeperModel(nextConfig, "playing"));
      setElapsed(0);
      setFlagMode(false);
      setResultClosed(false);
    },
    [difficultyId, muted],
  );

  const backToStart = useCallback(() => {
    setModel(createMinesweeperModel(config, "start"));
    setElapsed(0);
    setFlagMode(false);
    setResultClosed(false);
  }, [config]);

  const selectDifficulty = useCallback(
    (nextDifficulty: MinesweeperDifficultyId) => {
      setDifficultyId(nextDifficulty);
      const nextConfig = getConfigById(nextDifficulty);
      savedResultKeyRef.current = null;
      setElapsed(0);
      setFlagMode(false);
      setResultClosed(false);
      setModel(createMinesweeperModel(nextConfig, model.phase === "start" ? "start" : "playing"));
    },
    [model.phase],
  );

  const handleReveal = useCallback(
    (row: number, col: number, intent: FlagIntent = "normal") => {
      if (model.phase !== "playing") return;
      unlockMinesweeperAudio();
      if (intent === "flag" || flagMode) {
        const next = toggleMinesweeperFlag(model, row, col);
        if (next !== model) {
          setModel(next);
          playMinesweeperSound("flag", muted);
        }
        return;
      }

      const result = revealMinesweeperCell(model, config, row, col, Date.now());
      if (result.model === model && result.outcome === "ignored") return;
      setModel(result.model);

      if (result.outcome === "mine") {
        playMinesweeperSound("boom", muted);
        window.setTimeout(() => playMinesweeperSound("gameover", muted), 180);
      } else if (result.outcome === "win") {
        playMinesweeperSound("win", muted);
      } else if (result.outcome === "number") {
        playMinesweeperSound("number", muted);
      } else if (result.revealedCount > 0) {
        playMinesweeperSound("reveal", muted);
      }
    },
    [config, flagMode, model, muted],
  );

  const handleFlag = useCallback(
    (row: number, col: number) => {
      if (model.phase !== "playing") return;
      unlockMinesweeperAudio();
      const next = toggleMinesweeperFlag(model, row, col);
      if (next !== model) {
        setModel(next);
        playMinesweeperSound("flag", muted);
      }
    },
    [model, muted],
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    writeMinesweeperMuted(nextMuted);
    if (!nextMuted) {
      unlockMinesweeperAudio();
      playMinesweeperSound("number", false);
    }
  }, [muted]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)] sm:p-5" dir="ltr">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-2xl">{game.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Classic Minesweeper skin preserved, rebuilt as a Darma React game.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClassicSelect value={difficultyId} onChange={selectDifficulty} />
          {model.phase !== "start" ? <ClassicControlButton onClick={backToStart}>Start screen</ClassicControlButton> : null}
        </div>
      </div>

      {model.phase === "start" ? (
        <div className="flex justify-center py-4">
          <StartPanel
            gameTitle={game.title}
            config={config}
            best={currentBest}
            difficultyId={difficultyId}
            muted={muted}
            onSelectDifficulty={selectDifficulty}
            onStart={() => startRound()}
            onMute={toggleMute}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 xl:flex-row xl:items-start">
          <div className="relative max-w-full p-1">
            <div className="max-w-full overflow-x-auto">
            <ClassicBoard
              model={model}
              config={config}
              elapsed={finalElapsed}
              score={score}
              flagMode={flagMode}
              muted={muted}
              onNewGame={() => startRound()}
              onFlagMode={() => setFlagMode((value) => !value)}
              onMute={toggleMute}
              onReveal={handleReveal}
              onFlag={handleFlag}
            />
            </div>
            {(model.phase === "won" || model.phase === "lost") && !resultClosed ? (
              <ResultOverlay
                phase={model.phase}
                score={score}
                elapsed={finalElapsed}
                safeRevealed={safeRevealed}
                totalSafe={totalSafe}
                moves={model.moves}
                correctFlags={correctFlags}
                mines={config.mines}
                onPlayAgain={() => startRound()}
                onStartScreen={backToStart}
                onClose={() => setResultClosed(true)}
              />
            ) : null}
          </div>

          <div className="flex w-full max-w-[380px] flex-col gap-3">
            <InstructionPanel showInstructions={showInstructions} onToggle={() => setShowInstructions((value) => !value)} />
            <div className="p-1" style={classicOutsetStyle({ fontFamily: CLASSIC_FONT })}>
              <div className="grid grid-cols-2 gap-2 p-3 text-xs font-bold text-black" style={classicInsetStyle()}>
                <div>
                  <div className="uppercase text-[#333]">Safe cells</div>
                  <div className="mt-1 text-base">{safeRevealed}/{totalSafe}</div>
                </div>
                <div>
                  <div className="uppercase text-[#333]">Moves</div>
                  <div className="mt-1 text-base">{model.moves}</div>
                </div>
                <div>
                  <div className="uppercase text-[#333]">Best score</div>
                  <div className="mt-1 text-base text-[#ea3323]">{currentBest.bestScore}</div>
                </div>
                <div>
                  <div className="uppercase text-[#333]">Best time</div>
                  <div className="mt-1 text-base">{currentBest.bestTime === null ? "---" : formatMinesweeperTime(currentBest.bestTime)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
