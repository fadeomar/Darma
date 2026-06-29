"use client";

/**
 * Transient toast announcing achievements unlocked in the latest run/practice.
 *
 * - Shows only NEW unlocks (the parent passes a freshly-diffed list).
 * - Groups multiple unlocks into one card so it never stacks or blocks play.
 * - aria-live="polite" so screen readers hear it without interrupting.
 * - Auto-dismisses, and is manually dismissible.
 * - Sound + haptics for unlocks are fired once by useReactionGame, not here, so
 *   the toast stays a pure presentational layer.
 * - Motion is CSS-only and disabled under prefers-reduced-motion.
 */

import { useEffect } from "react";
import { Trophy, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { RARITY_LABELS } from "./reactionAchievements";
import type { Achievement } from "./reactionTypes";

export function ReactionAchievementToast({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[];
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!achievements.length) return;
    // Give a little longer when several unlocked at once.
    const timeout = Math.min(9000, 5000 + achievements.length * 800);
    const id = window.setTimeout(onDismiss, timeout);
    return () => window.clearTimeout(id);
  }, [achievements, onDismiss]);

  if (!achievements.length) return null;

  return (
    <div className="rtp-toast" role="status" aria-live="polite">
      <div className="rtp-toast-head">
        <span className="rtp-toast-label">
          <Trophy className="rtp-toast-trophy h-4 w-4" aria-hidden />
          {achievements.length > 1 ? `${achievements.length} achievements unlocked` : "Achievement unlocked"}
        </span>
        <button type="button" onClick={onDismiss} className="rtp-toast-close" aria-label="Dismiss">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ul className="rtp-toast-list">
        {achievements.map((achievement, index) => (
          <li key={achievement.id} className="rtp-toast-item" style={{ animationDelay: `${index * 70}ms` }}>
            <span className="rtp-toast-glyph" aria-hidden>
              {achievement.glyph}
            </span>
            <span className="rtp-toast-text">
              <span className="rtp-toast-title">{achievement.title}</span>
              <span className="rtp-toast-desc">{achievement.description}</span>
            </span>
            <span className={cn("rtp-ach-rarity", `rtp-ach-rarity--${achievement.rarity}`)}>
              {RARITY_LABELS[achievement.rarity]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
