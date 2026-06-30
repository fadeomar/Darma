"use client";

import {
  ArrowDownToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCw,
} from "lucide-react";
import type { Action } from "./tetrisTypes";

/**
 * Touch / pointer controls, shown below the board on small screens. Each button
 * dispatches a single action; `aria-label`s keep them accessible.
 */
export function TouchControls({
  paused,
  onAction,
  onTogglePause,
}: {
  paused: boolean;
  onAction: (action: Action) => void;
  onTogglePause: () => void;
}) {
  return (
    <div className="dt-touch" aria-label="Touch controls">
      <button type="button" className="dt-touch-btn" aria-label="Move left" onClick={() => onAction("Left")}>
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" className="dt-touch-btn" aria-label="Rotate" onClick={() => onAction("Rotate")}>
        <RotateCw className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" className="dt-touch-btn" aria-label="Move right" onClick={() => onAction("Right")}>
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" className="dt-touch-btn" aria-label="Soft drop" onClick={() => onAction("SlowDrop")}>
        <ChevronDown className="h-6 w-6" aria-hidden />
      </button>
      <button
        type="button"
        className="dt-touch-btn dt-touch-btn--accent"
        aria-label="Hard drop"
        onClick={() => onAction("FastDrop")}
      >
        <ArrowDownToLine className="h-6 w-6" aria-hidden />
      </button>
      <button
        type="button"
        className="dt-touch-btn"
        aria-label={paused ? "Resume" : "Pause"}
        onClick={onTogglePause}
      >
        {paused ? <Play className="h-6 w-6" aria-hidden /> : <Pause className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  );
}
