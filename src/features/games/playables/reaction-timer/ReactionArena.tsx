"use client";

/**
 * The play surface: Canvas background + an HTML overlay for readable content.
 * The whole surface is the reaction target during waiting/signal ("press
 * anywhere"). Pointer input uses pointerdown for low latency; keyboard is
 * handled globally by the orchestrator.
 */

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ReactionCanvasStage } from "./ReactionCanvasStage";
import { isGameplayControlTarget } from "./reactionRuntimeGuards";
import type { ReactionPhase } from "./reactionTypes";

const TONE_CLASS: Record<ReactionPhase, string> = {
  idle: "rtp-stage--idle",
  countdown: "rtp-stage--idle",
  waiting: "rtp-stage--waiting",
  signal: "rtp-stage--signal",
  "too-early": "rtp-stage--error",
  "round-result": "rtp-stage--idle",
  "final-summary": "rtp-stage--idle",
  paused: "rtp-stage--waiting",
};

export function ReactionArena({
  phase,
  countdownValue = null,
  reducedMotion,
  interactive,
  onPress,
  ariaLabel,
  accessibilityHint,
  topControls,
  modal,
  onModalBackdrop,
  children,
}: {
  phase: ReactionPhase;
  countdownValue?: number | null;
  reducedMotion: boolean;
  interactive: boolean;
  onPress: () => void;
  ariaLabel: string;
  /** Extra screen-reader context for the current canvas/arena mode. */
  accessibilityHint?: ReactNode;
  topControls?: ReactNode;
  /** Optional overlay layer (e.g. the settings dialog) drawn above everything. */
  modal?: ReactNode;
  /** Called when the modal backdrop (not its content) is activated. */
  onModalBackdrop?: () => void;
  children: ReactNode;
}) {
  const descriptionId = useId();

  return (
    <div
      className={cn("rtp-stage", TONE_CLASS[phase], phase === "too-early" && !reducedMotion && "rtp-stage--shake")}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      aria-describedby={accessibilityHint ? descriptionId : undefined}
      data-rtp-active-stage={interactive ? "true" : undefined}
      onPointerDown={
        interactive
          ? (event) => {
              if (isGameplayControlTarget(event.target)) return;
              event.preventDefault();
              onPress();
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              if (event.code !== "Space" && event.code !== "Enter") return;
              if (isGameplayControlTarget(event.target)) return;
              event.preventDefault();
              event.stopPropagation();
              onPress();
            }
          : undefined
      }
    >
      {accessibilityHint ? (
        <p id={descriptionId} className="sr-only">
          {accessibilityHint}
        </p>
      ) : null}
      <ReactionCanvasStage phase={phase} countdownValue={countdownValue} reducedMotion={reducedMotion} className="rtp-canvas" />
      {topControls ? (
        // Stop pointer/touch events here so tapping Sound/Pause/Exit in fullscreen
        // never bubbles up to the stage and counts as a reaction or early press.
        <div
          className="rtp-stage-top"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {topControls}
        </div>
      ) : null}
      <div className={cn("rtp-stage-overlay", interactive && "rtp-stage-overlay--interactive")}>{children}</div>
      {modal ? (
        // Full-stage layer above the overlay. Stops pointer/click from reaching
        // the stage; activating the backdrop itself closes the modal.
        <div
          className="rtp-stage-modal"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) onModalBackdrop?.();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {modal}
        </div>
      ) : null}
    </div>
  );
}
