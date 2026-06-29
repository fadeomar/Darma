"use client";

/**
 * In-player settings panel for Reaction Timer Pro. Rendered as an overlay on the
 * dark arena, so its controls are custom-styled for that surface rather than the
 * light UI kit.
 *
 * Input-safety: every pointer/click inside the panel is stopped so it can never
 * bubble to the arena and register as a reaction or early press. Escape closes
 * the panel locally (stopped from reaching the global pause handler).
 */

import { useEffect, useId, useRef } from "react";
import { RotateCcw, Vibrate, Volume2, X } from "lucide-react";
import type { ReactionSettings } from "./reactionSettings";

type ToggleRowProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ id, label, description, checked, disabled, onChange }: ToggleRowProps) {
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div className="rtp-set-row">
      <div className="rtp-set-text">
        <label htmlFor={id} className="rtp-set-label">
          {label}
        </label>
        {description ? (
          <span id={descId} className="rtp-set-desc">
            {description}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        disabled={disabled}
        className="rtp-switch"
        data-on={checked ? "true" : "false"}
        onClick={() => onChange(!checked)}
      >
        <span className="rtp-switch-thumb" aria-hidden />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export function ReactionSettingsPanel({
  settings,
  hapticsAvailable,
  onUpdate,
  onReset,
  onTestSound,
  onTestHaptics,
  onClose,
}: {
  settings: ReactionSettings;
  hapticsAvailable: boolean;
  onUpdate: <K extends keyof ReactionSettings>(key: K, value: ReactionSettings[K]) => void;
  onReset: () => void;
  onTestSound: () => void;
  onTestHaptics: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const volumeId = `${baseId}-volume`;

  // Move focus into the panel when it opens so keyboard users land inside it.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const volumePct = Math.round(settings.volume * 100);

  return (
    <div
      ref={panelRef}
      className="rtp-settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      // Keep all interaction local to the panel.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="rtp-settings-head">
        <h2 id={titleId} className="rtp-settings-title">
          Settings
        </h2>
        <button ref={closeRef} type="button" className="rtp-settings-close" onClick={onClose} aria-label="Close settings">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="rtp-settings-body">
        <ToggleRow
          id={`${baseId}-sound`}
          label="Sound effects"
          description="Procedural audio cues for the signal, results, and more."
          checked={settings.soundEnabled}
          onChange={(next) => onUpdate("soundEnabled", next)}
        />

        <div className="rtp-set-row">
          <div className="rtp-set-text">
            <label htmlFor={volumeId} className="rtp-set-label">
              Volume
            </label>
            <span className="rtp-set-desc">{volumePct}%</span>
          </div>
          <input
            id={volumeId}
            type="range"
            min={0}
            max={100}
            step={5}
            value={volumePct}
            disabled={!settings.soundEnabled}
            aria-label="Sound volume"
            aria-valuetext={`${volumePct} percent`}
            className="rtp-range"
            onChange={(event) => onUpdate("volume", Number(event.target.value) / 100)}
          />
        </div>

        <ToggleRow
          id={`${baseId}-haptics`}
          label="Haptics"
          description={hapticsAvailable ? "Subtle vibration on supported mobile devices." : "Not supported on this device."}
          checked={settings.hapticsEnabled}
          disabled={!hapticsAvailable}
          onChange={(next) => onUpdate("hapticsEnabled", next)}
        />

        <ToggleRow
          id={`${baseId}-motion`}
          label="Reduce effects"
          description="Calm the canvas animation and motion."
          checked={settings.reducedEffects}
          onChange={(next) => onUpdate("reducedEffects", next)}
        />

        <ToggleRow
          id={`${baseId}-autoadvance`}
          label="Auto-advance rounds"
          description="Move to the next round automatically after a result."
          checked={settings.autoAdvance}
          onChange={(next) => onUpdate("autoAdvance", next)}
        />

        <ToggleRow
          id={`${baseId}-hints`}
          label="Show hints"
          description="Contextual coaching text during play."
          checked={settings.showHints}
          onChange={(next) => onUpdate("showHints", next)}
        />

        <ToggleRow
          id={`${baseId}-inputhints`}
          label="Input hints"
          description="Show the click / tap / keyboard affordances."
          checked={settings.inputHints}
          onChange={(next) => onUpdate("inputHints", next)}
        />

        <ToggleRow
          id={`${baseId}-contrast`}
          label="High contrast"
          description="Stronger text and borders for readability."
          checked={settings.highContrastMode}
          onChange={(next) => onUpdate("highContrastMode", next)}
        />
      </div>

      <div className="rtp-settings-foot">
        <div className="rtp-settings-tests">
          <button type="button" className="rtp-settings-test" onClick={onTestSound} disabled={!settings.soundEnabled}>
            <Volume2 className="h-4 w-4" aria-hidden /> Test sound
          </button>
          {hapticsAvailable ? (
            <button
              type="button"
              className="rtp-settings-test"
              onClick={onTestHaptics}
              disabled={!settings.hapticsEnabled}
            >
              <Vibrate className="h-4 w-4" aria-hidden /> Test vibration
            </button>
          ) : null}
        </div>
        <button type="button" className="rtp-settings-reset" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset settings
        </button>
      </div>
    </div>
  );
}
