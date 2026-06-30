"use client";

/**
 * Tetris — the production player for `/games/tetris`.
 *
 * Owns the lifecycle (idle → playing ⇄ paused → over) and the high-score store;
 * a single live run lives in <TetrisRunner>, remounted via `runKey` for a clean
 * restart. Overlays for the start, pause and game-over states sit above the
 * board so the stage never changes size (no layout shift on start).
 *
 * Ported from a CodeSandbox React-hooks Tetris prototype; no licence file
 * accompanied the original source. See `tetrisEngine.ts` for the port notes.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gamepad2,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import { buildBoard } from "./tetrisEngine";
import { TetrisBoard } from "./TetrisBoard";
import { TetrisRunner } from "./TetrisRunner";
import { commitHighScore, readHighScore } from "./tetrisStorage";
import type { TetrisResult, TetrisStatus } from "./tetrisTypes";

const ROWS = 20;
const COLUMNS = 10;

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "← →", label: "Move" },
  { keys: "↑", label: "Rotate" },
  { keys: "↓", label: "Soft drop" },
  { keys: "Space", label: "Hard drop" },
  { keys: "P", label: "Pause" },
  { keys: "Q / Esc", label: "Quit" },
];

export function TetrisGame({ game }: { game: GameDefinition }) {
  const router = useRouter();
  const [status, setStatus] = useState<TetrisStatus>("idle");
  const [runKey, setRunKey] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [lastResult, setLastResult] = useState<TetrisResult | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  useEffect(() => {
    setHighScore(readHighScore());
    setHydrated(true);
  }, []);

  const start = useCallback(() => {
    setLastResult(null);
    setIsRecord(false);
    setRunKey((key) => key + 1);
    setStatus("playing");
  }, []);

  const togglePause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current === "paused" ? "playing" : current));
  }, []);

  const quit = useCallback(() => {
    setStatus("idle");
  }, []);

  const handleGameOver = useCallback((result: TetrisResult) => {
    setLastResult(result);
    setHighScore((previousBest) => {
      const best = commitHighScore(result.points);
      setIsRecord(result.points > 0 && result.points >= best && best > previousBest);
      return best;
    });
    setStatus("over");
  }, []);

  // Start / restart from the keyboard while no run is active.
  useEffect(() => {
    if (status !== "idle" && status !== "over") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, start]);

  const isPlaying = status === "playing" || status === "paused";

  return (
    <div className="dt-shell">
      <div className="dt-topbar">
        <div className="dt-topbar-id">
          <span className="dt-eyebrow">Playable game</span>
          <h2 className="dt-topbar-title">{game.title}</h2>
        </div>
        <div className="dt-topbar-controls">
          <Badge variant="soft">10 × 20</Badge>
          <Badge variant="outline">Keyboard + touch</Badge>
          {isPlaying ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                leftIcon={status === "paused" ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
              >
                {status === "paused" ? "Resume" : "Pause"}
              </Button>
              <Button variant="secondary" size="sm" onClick={quit}>
                Quit
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="dt-stage">
        {isPlaying ? (
          <TetrisRunner
            key={runKey}
            rows={ROWS}
            columns={COLUMNS}
            paused={status === "paused"}
            highScore={highScore}
            onGameOver={handleGameOver}
            onTogglePause={togglePause}
            onQuit={quit}
          />
        ) : (
          <IdleLayout highScore={hydrated ? highScore : 0} />
        )}

        {status === "idle" ? (
          <Overlay>
            <span className="dt-overlay-eyebrow">Block puzzle</span>
            <h3 className="dt-overlay-title">Ready to stack?</h3>
            <p className="dt-overlay-text">
              Clear lines by filling complete rows. The board speeds up every 10 lines — survive as long
              as you can and chase your high score.
            </p>
            <Button size="lg" onClick={start} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
              Start game
            </Button>
            <p className="dt-overlay-hint">Press Enter or Space to start</p>
          </Overlay>
        ) : null}

        {status === "paused" ? (
          <Overlay>
            <span className="dt-overlay-eyebrow">Paused</span>
            <h3 className="dt-overlay-title">Take a breath</h3>
            <div className="dt-overlay-actions">
              <Button size="lg" onClick={togglePause} leftIcon={<Play className="h-5 w-5" aria-hidden />}>
                Resume
              </Button>
              <Button size="lg" variant="outline" onClick={quit} leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}>
                Quit to menu
              </Button>
            </div>
          </Overlay>
        ) : null}

        {status === "over" && lastResult ? (
          <Overlay>
            <span className="dt-overlay-eyebrow">Game over</span>
            <h3 className="dt-overlay-title">Stack toppled</h3>
            {isRecord ? (
              <span className="dt-record">
                <Trophy className="h-4 w-4" aria-hidden /> New high score!
              </span>
            ) : null}
            <div className="dt-result-grid">
              <ResultStat label="Score" value={lastResult.points.toLocaleString()} highlight />
              <ResultStat label="Level" value={lastResult.level} />
              <ResultStat label="Lines" value={lastResult.lines} />
              <ResultStat label="Best" value={highScore.toLocaleString()} />
            </div>
            <div className="dt-overlay-actions">
              <Button size="lg" onClick={start} leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                Play again
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/games")}
                leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}
              >
                Back to games
              </Button>
            </div>
          </Overlay>
        ) : null}
      </div>

      <div className="dt-guide">
        <span className="dt-guide-title">
          <Keyboard className="h-4 w-4" aria-hidden /> Controls
        </span>
        <ul className="dt-guide-list">
          {CONTROLS.map((control) => (
            <li key={control.label} className="dt-guide-item">
              <kbd className="dt-kbd">{control.keys}</kbd>
              <span>{control.label}</span>
            </li>
          ))}
        </ul>
        <span className="dt-guide-touch">
          <Gamepad2 className="h-4 w-4" aria-hidden /> On touch devices, use the on-screen buttons below the board.
        </span>
      </div>
    </div>
  );
}

/** Static, correctly-sized board + panel shown before/after a run (no layout shift). */
function IdleLayout({ highScore }: { highScore: number }) {
  const board = buildBoard({ rows: ROWS, columns: COLUMNS });
  return (
    <div className="dt-layout dt-layout--idle" aria-hidden>
      <div className="dt-board-wrap">
        <TetrisBoard board={board} />
      </div>
      <aside className="dt-panel">
        <div className="dt-stat-grid">
          <div className="dt-stat dt-stat--highlight">
            <span className="dt-stat-label">Score</span>
            <span className="dt-stat-value">0</span>
          </div>
          <div className="dt-stat">
            <span className="dt-stat-label">Level</span>
            <span className="dt-stat-value">1</span>
          </div>
          <div className="dt-stat">
            <span className="dt-stat-label">Lines</span>
            <span className="dt-stat-value">0</span>
          </div>
          <div className="dt-stat">
            <span className="dt-stat-label">To next</span>
            <span className="dt-stat-value">10</span>
          </div>
        </div>
        <div className="dt-highscore">
          <span className="dt-stat-label">High score</span>
          <span className="dt-highscore-value">{highScore.toLocaleString()}</span>
        </div>
      </aside>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="dt-overlay">
      <div className="dt-overlay-card">{children}</div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn("dt-result-stat", highlight && "dt-result-stat--highlight")}>
      <span className="dt-stat-label">{label}</span>
      <span className="dt-result-value">{value}</span>
    </div>
  );
}
