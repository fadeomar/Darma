"use client";

/**
 * Local-only first-run onboarding state for Reaction Timer Pro.
 *
 * This intentionally lives outside the main gameplay stats blob so skipping or
 * completing the tutorial never risks touching official scores, achievements,
 * daily streaks, or settings.
 */

import { useCallback, useEffect, useState } from "react";

export const REACTION_ONBOARDING_KEY = "darma.game.reactionTimer.onboarding.v1";

export type ReactionOnboardingState = {
  introCompleted: boolean;
  firstCompletedAt: string | null;
  skippedAt: string | null;
  updatedAt: string | null;
};

const DEFAULT_ONBOARDING: ReactionOnboardingState = {
  introCompleted: false,
  firstCompletedAt: null,
  skippedAt: null,
  updatedAt: null,
};

function canUseStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function normalize(value: unknown): ReactionOnboardingState {
  if (!value || typeof value !== "object") return DEFAULT_ONBOARDING;
  const state = value as Partial<ReactionOnboardingState>;
  return {
    introCompleted: Boolean(state.introCompleted),
    firstCompletedAt: typeof state.firstCompletedAt === "string" ? state.firstCompletedAt : null,
    skippedAt: typeof state.skippedAt === "string" ? state.skippedAt : null,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null,
  };
}

export function loadReactionOnboarding(): ReactionOnboardingState {
  if (!canUseStorage()) return DEFAULT_ONBOARDING;
  try {
    const raw = window.localStorage.getItem(REACTION_ONBOARDING_KEY);
    if (!raw) return DEFAULT_ONBOARDING;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export function saveReactionOnboarding(state: ReactionOnboardingState): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(REACTION_ONBOARDING_KEY, JSON.stringify(state));
  } catch {
    // Non-blocking: the game remains fully playable if localStorage is blocked.
  }
}

export function useReactionOnboarding() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ReactionOnboardingState>(DEFAULT_ONBOARDING);

  useEffect(() => {
    setState(loadReactionOnboarding());
    setReady(true);
  }, []);

  const completeIntro = useCallback((reason: "completed" | "skipped" = "completed") => {
    const now = new Date().toISOString();
    setState((current) => {
      const next: ReactionOnboardingState = {
        ...current,
        introCompleted: true,
        firstCompletedAt: current.firstCompletedAt ?? (reason === "completed" ? now : null),
        skippedAt: reason === "skipped" ? now : current.skippedAt,
        updatedAt: now,
      };
      saveReactionOnboarding(next);
      return next;
    });
  }, []);

  const resetIntro = useCallback(() => {
    setState(DEFAULT_ONBOARDING);
    if (!canUseStorage()) return;
    try {
      window.localStorage.removeItem(REACTION_ONBOARDING_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  return { ready, onboarding: state, completeIntro, resetIntro };
}
