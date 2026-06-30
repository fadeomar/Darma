"use client";

import { Lock, Palette, RotateCcw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  REACTION_THEMES,
  getUnlockedThemeCount,
  isThemeUnlocked,
  type ReactionThemeId,
} from "./reactionThemes";
import type { ReactionStorageV2 } from "./reactionTypes";

export function ReactionThemePanel({
  stats,
  selectedThemeId,
  activeThemeId,
  onSelectTheme,
  onResetTheme,
}: {
  stats: ReactionStorageV2;
  selectedThemeId: ReactionThemeId;
  activeThemeId: ReactionThemeId;
  onSelectTheme: (themeId: ReactionThemeId) => void;
  onResetTheme: () => void;
}) {
  const unlockedCount = getUnlockedThemeCount(stats);

  return (
    <Card variant="default" padding="lg" className="rtp-theme-panel">
      <div className="rtp-theme-head">
        <div className="rtp-panel-head-left">
          <Palette className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <div>
            <h3 className="rtp-panel-title">Themes & unlockables</h3>
            <p className="rtp-theme-subtitle">Choose a local arena look. Unlocks stay on this device only.</p>
          </div>
        </div>
        <span className="rtp-theme-count" aria-label={`${unlockedCount} of ${REACTION_THEMES.length} themes unlocked`}>
          {unlockedCount} / {REACTION_THEMES.length} unlocked
        </span>
      </div>

      <div className="rtp-theme-grid" role="list" aria-label="Reaction Timer Pro themes">
        {REACTION_THEMES.map((theme) => {
          const unlocked = isThemeUnlocked(theme, stats);
          const selected = activeThemeId === theme.id;
          const persistedButLocked = selectedThemeId === theme.id && !unlocked;
          return (
            <button
              key={theme.id}
              type="button"
              role="listitem"
              className={cn("rtp-theme-card", selected && "rtp-theme-card--selected", !unlocked && "rtp-theme-card--locked")}
              disabled={!unlocked}
              aria-pressed={selected}
              aria-label={`${theme.label}. ${unlocked ? "Unlocked" : `Locked. ${theme.unlockLabel}`}`}
              onClick={() => onSelectTheme(theme.id)}
            >
              <span className="rtp-theme-preview" style={{ background: theme.preview }} aria-hidden>
                <span style={{ background: theme.accent }} />
              </span>
              <span className="rtp-theme-body">
                <span className="rtp-theme-row">
                  <span className="rtp-theme-title">{theme.label}</span>
                  {selected ? (
                    <span className="rtp-theme-pill">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden /> Active
                    </span>
                  ) : unlocked ? (
                    <span className="rtp-theme-pill rtp-theme-pill--muted">Unlocked</span>
                  ) : (
                    <span className="rtp-theme-pill rtp-theme-pill--locked">
                      <Lock className="h-3.5 w-3.5" aria-hidden /> Locked
                    </span>
                  )}
                </span>
                <span className="rtp-theme-desc">{theme.description}</span>
                <span className="rtp-theme-unlock">{theme.unlockLabel}</span>
                {persistedButLocked ? (
                  <span className="rtp-theme-unlock rtp-theme-unlock--warn">
                    This saved theme is locked after a stats reset. Darma Classic is active.
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rtp-theme-foot">
        <p>
          Accessibility note: <strong>High Contrast</strong> is always available and never locked behind progression.
        </p>
        <button type="button" className="rtp-theme-reset" onClick={onResetTheme}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset theme
        </button>
      </div>
    </Card>
  );
}
