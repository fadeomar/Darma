"use client";

/**
 * Neon Core Defense — settings panel.
 *
 * Pure presentation: it renders the current `GameSettings` and calls `onChange`
 * with a partial patch for every adjustment. It holds no state and never persists —
 * the parent merges the patch through the pure progression module and writes once,
 * so a slider drag can't hammer storage on every frame (the parent debounces writes,
 * not this component).
 *
 * Toggles expose both `aria-pressed` and a visible On/Off label, so state never
 * depends on colour alone, and every control is reachable and labelled for keyboard
 * and screen-reader users.
 */

import { Gauge, Music, RotateCw, Sparkles, Vibrate, Volume2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameSettings } from "./neonCoreProgression";

type ToggleKey = "music" | "sfx" | "reducedMotion" | "screenShake" | "particles" | "haptics" | "performanceMode";

const TOGGLES: { key: ToggleKey; label: string; hint: string; icon: React.ReactNode }[] = [
  { key: "music", label: "Music", hint: "Generative background music.", icon: <Music className="h-4 w-4" aria-hidden /> },
  { key: "sfx", label: "Sound effects", hint: "Shots, hits, waves, and alerts.", icon: <Volume2 className="h-4 w-4" aria-hidden /> },
  { key: "reducedMotion", label: "Reduced motion", hint: "Calms shake, trails, and pulses. Also follows your system setting.", icon: <Gauge className="h-4 w-4" aria-hidden /> },
  { key: "screenShake", label: "Screen shake", hint: "Camera kick on core hits.", icon: <Zap className="h-4 w-4" aria-hidden /> },
  { key: "particles", label: "Particles", hint: "Impact and destruction bursts.", icon: <Sparkles className="h-4 w-4" aria-hidden /> },
  { key: "haptics", label: "Vibration", hint: "Haptic feedback on supported phones.", icon: <Vibrate className="h-4 w-4" aria-hidden /> },
  { key: "performanceMode", label: "Performance mode", hint: "Fewer effects for low-power devices.", icon: <RotateCw className="h-4 w-4" aria-hidden /> },
];

export function NeonCoreSettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: GameSettings;
  onChange: (patch: Partial<GameSettings>) => void;
  onClose: () => void;
}) {
  return (
    <div className="dncd-settings" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="dncd-settings-head">
        <h3 className="dncd-settings-title">Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose} leftIcon={<X className="h-4 w-4" aria-hidden />}>
          Close
        </Button>
      </div>

      <div className="dncd-settings-body">
        <fieldset className="dncd-settings-group">
          <legend className="dncd-settings-legend">Audio levels</legend>
          <Slider
            label="Music volume"
            value={settings.musicVolume}
            disabled={!settings.music}
            onChange={(musicVolume) => onChange({ musicVolume })}
          />
          <Slider
            label="Sound effects volume"
            value={settings.sfxVolume}
            disabled={!settings.sfx}
            onChange={(sfxVolume) => onChange({ sfxVolume })}
          />
        </fieldset>

        <div className="dncd-settings-toggles" role="group" aria-label="Toggles">
          {TOGGLES.map((toggle) => {
            const on = settings[toggle.key];
            return (
              <button
                key={toggle.key}
                type="button"
                className={cn("dncd-settings-toggle", on && "dncd-settings-toggle--on")}
                role="switch"
                aria-checked={on}
                onClick={() => onChange({ [toggle.key]: !on } as Partial<GameSettings>)}
              >
                <span className="dncd-settings-toggle-icon">{toggle.icon}</span>
                <span className="dncd-settings-toggle-copy">
                  <strong>{toggle.label}</strong>
                  <span>{toggle.hint}</span>
                </span>
                <span className={cn("dncd-settings-state", on && "dncd-settings-state--on")}>{on ? "On" : "Off"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <label className={cn("dncd-slider", disabled && "dncd-slider--disabled")}>
      <span className="dncd-slider-label">
        {label}
        <span className="dncd-slider-value">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </label>
  );
}
