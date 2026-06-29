"use client";

import { Accessibility, CheckCircle2, Contrast, Eye, Keyboard, MousePointerClick, VolumeX } from "lucide-react";
import { Card } from "@/components/ui";
import { ACCESSIBILITY_AUDIT_ITEMS, ACCESSIBILITY_MODE_NOTES } from "./reactionAccessibility";
import type { ReactionSettings } from "./reactionSettings";

export function ReactionAccessibilityPanel({ settings }: { settings: ReactionSettings }) {
  return (
    <section className="rtp-accessibility" aria-labelledby="rtp-accessibility-title">
      <Card variant="default" padding="lg" className="rtp-accessibility-card">
        <div className="rtp-panel-head rtp-accessibility-head">
          <Accessibility className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
          <div>
            <h3 id="rtp-accessibility-title" className="rtp-panel-title">Accessibility audit</h3>
            <p className="rtp-accessibility-sub">
              Sprint 19 adds an honest accessibility contract for a visual reflex game: readable text, keyboard-safe UI, optional sound/haptics, and clear pointer-mode notes.
            </p>
          </div>
        </div>

        <div className="rtp-accessibility-statusgrid" aria-label="Current accessibility settings">
          <div className="rtp-accessibility-status">
            <Contrast className="h-4 w-4" aria-hidden />
            <span>Contrast</span>
            <strong>{settings.highContrastMode ? "High contrast on" : "Standard"}</strong>
          </div>
          <div className="rtp-accessibility-status">
            <Eye className="h-4 w-4" aria-hidden />
            <span>Motion</span>
            <strong>{settings.reducedEffects ? "Reduced" : "Full effects"}</strong>
          </div>
          <div className="rtp-accessibility-status">
            <Keyboard className="h-4 w-4" aria-hidden />
            <span>Input hints</span>
            <strong>{settings.inputHints ? "Visible" : "Hidden"}</strong>
          </div>
          <div className="rtp-accessibility-status">
            <VolumeX className="h-4 w-4" aria-hidden />
            <span>Sound required?</span>
            <strong>No</strong>
          </div>
        </div>

        <div className="rtp-accessibility-grid">
          <div className="rtp-accessibility-block">
            <h4>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> What is covered
            </h4>
            <ul>
              {ACCESSIBILITY_AUDIT_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rtp-accessibility-block">
            <h4>
              <MousePointerClick className="h-4 w-4" aria-hidden /> Mode input notes
            </h4>
            <ul>
              {ACCESSIBILITY_MODE_NOTES.map((note) => (
                <li key={note.id}>
                  <strong>{note.title}:</strong> {note.keyboard} {note.pointer}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="rtp-accessibility-note">
          Target Hunter and several Level Challenge stages are intentionally visual and pointer-heavy. The surrounding UI, objectives, score summaries, and settings remain keyboard-readable and screen-reader friendly where practical.
        </p>
      </Card>
    </section>
  );
}
