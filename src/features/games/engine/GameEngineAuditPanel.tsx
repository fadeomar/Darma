"use client";

import { Code2, Gamepad2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { DARMA_GAME_QA_CHECKLIST } from "./gameQaChecklist";

const ENGINE_PRIMITIVES = [
  "GameFullscreenShell",
  "GameCanvasStageBase",
  "createLocalJsonStore",
  "DarmaGameModeSummary",
  "DarmaGame QA checklist",
  "Games engine documentation",
];

/**
 * Small contributor-facing panel used by Reaction Timer Pro to document that it
 * is now the reference implementation for future Darma games.
 */
export function GameEngineAuditPanel() {
  const previewItems = DARMA_GAME_QA_CHECKLIST.slice(0, 6);
  return (
    <Card variant="default" padding="lg" className="darma-game-engine-panel">
      <div className="darma-game-engine-panel__head">
        <span className="darma-game-engine-panel__icon" aria-hidden>
          <Gamepad2 className="h-5 w-5" />
        </span>
        <span>
          <h3 className="rtp-panel-title">Reusable Darma Games engine</h3>
          <p className="darma-game-engine-panel__lead">
            Reaction Timer Pro is now the reference playable for future Darma games: local-first storage,
            fullscreen-safe UI, Canvas gameplay, share actions, accessibility notes, and QA patterns.
          </p>
        </span>
      </div>

      <div className="darma-game-engine-grid">
        <div className="darma-game-engine-card">
          <span className="darma-game-engine-card__title">
            <Code2 className="h-4 w-4" aria-hidden />
            Extracted primitives
          </span>
          <ul className="darma-game-engine-list">
            {ENGINE_PRIMITIVES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="darma-game-engine-card">
          <span className="darma-game-engine-card__title">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Future-game QA starter
          </span>
          <ul className="darma-game-engine-list">
            {previewItems.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="darma-game-engine-panel__note">
        Docs: <code>src/features/games/engine/README.md</code> and <code>docs/games-engine.md</code>.
        Shared code stays game-agnostic; Reaction Timer-specific modes remain inside the Reaction Timer folder.
      </p>
    </Card>
  );
}
