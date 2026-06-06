"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Button, CopyButton, Input, Select, Slider } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  annotatePassword,
  calculateStrength,
  generatePassphrase,
  generatePassword,
} from "./generator";
import { AnnotatedPassword, PasswordCharacterLegend } from "./PasswordCharacterLegend";
import { PasswordSecuritySections } from "./PasswordSecuritySections";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import type { PasswordConfig, PasswordMode } from "./types";

const DEFAULT_CONFIG: PasswordConfig = {
  mode: "password",
  length: 18,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: true,
  excludeAmbiguous: false,
  wordCount: 4,
  separator: "-",
  capitalizeWords: true,
  includeNumber: true,
  includeSymbol: false,
  seedText: "",
};

type PasswordToggleKey = "uppercase" | "lowercase" | "numbers" | "symbols" | "excludeSimilar" | "excludeAmbiguous";

const passwordOptionLabels: Array<{ key: PasswordToggleKey; label: string; help: string; group: "charset" | "readability" }> = [
  { key: "uppercase", label: "Uppercase", help: "A–Z", group: "charset" },
  { key: "lowercase", label: "Lowercase", help: "a–z", group: "charset" },
  { key: "numbers", label: "Numbers", help: "0–9", group: "charset" },
  { key: "symbols", label: "Symbols", help: "! @ #", group: "charset" },
  { key: "excludeSimilar", label: "Exclude similar", help: "No l, 1, O, 0", group: "readability" },
  { key: "excludeAmbiguous", label: "Exclude ambiguous", help: "Avoid brackets and quotes", group: "readability" },
];

const passphraseSeparators = [
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Dot (.)" },
  { value: " ", label: "Space" },
  { value: "random", label: "Random" },
];

function getActiveCharacterSetCount(config: PasswordConfig) {
  return [config.uppercase, config.lowercase, config.numbers, config.symbols].filter(Boolean).length;
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text-tertiary)]">
        {label}
      </div>
      {hint ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{hint}</p> : null}
    </div>
  );
}

function SliderWithNumber({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = `password-generator-${label.toLowerCase().replace(/\s+/g, "-")}`;

  function commitValue(rawValue: number) {
    if (!Number.isFinite(rawValue)) return;
    onChange(Math.min(max, Math.max(min, Math.round(rawValue))));
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label htmlFor={id} className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text-tertiary)]">
            {label}
          </label>
          {hint ? <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">{hint}</p> : null}
        </div>
        <Input
          type="number"
          size="sm"
          width="numeric"
          value={value}
          min={min}
          max={max}
          aria-label={`${label} number`}
          onChange={(event) => commitValue(Number(event.target.value))}
          className="font-mono tabular-nums"
        />
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(event) => commitValue(Number(event.target.value))}
      />
    </div>
  );
}

function ToggleCard({
  label,
  help,
  pressed,
  onClick,
}: {
  label: string;
  help: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "group flex min-h-[74px] items-start justify-between gap-3 rounded-[var(--radius-md)] border p-4 text-left shadow-[var(--shadow-xs)] outline-none transition focus-visible:shadow-[var(--focus-ring)]",
        pressed
          ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]",
      )}
    >
      <span>
        <span className="block font-semibold text-[var(--color-text-primary)]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--color-text-tertiary)]">{help}</span>
      </span>
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition",
          pressed
            ? "border-[var(--color-primary-border)] bg-[var(--color-primary)]"
            : "border-[var(--color-border-default)] bg-[var(--color-control-track)]",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-[var(--color-surface-raised)] shadow-[var(--shadow-xs)] transition-transform",
            pressed && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function ModeCard({
  mode,
  title,
  description,
  active,
  onClick,
}: {
  mode: PasswordMode;
  title: string;
  description: string;
  active: boolean;
  onClick: (mode: PasswordMode) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(mode)}
      className={cn(
        "rounded-[var(--radius-md)] border p-4 text-left outline-none transition focus-visible:shadow-[var(--focus-ring)]",
        active
          ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-xs)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]",
      )}
    >
      <span className="flex items-center gap-2 font-black text-[var(--color-text-primary)]">
        {active ? <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" aria-hidden /> : null}
        {title}
      </span>
      <span className="mt-2 block text-sm leading-6 text-[var(--color-text-secondary)]">{description}</span>
    </button>
  );
}

function SettingsPanel({ config, patch }: { config: PasswordConfig; patch: (next: Partial<PasswordConfig>) => void }) {
  function togglePasswordOption(key: PasswordToggleKey) {
    const characterSetKeys: PasswordToggleKey[] = ["uppercase", "lowercase", "numbers", "symbols"];

    if (characterSetKeys.includes(key) && config[key] && getActiveCharacterSetCount(config) === 1) {
      return;
    }

    patch({ [key]: !config[key] } as Partial<PasswordConfig>);
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Generator mode</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Settings</h2>
        </div>
        <Badge variant="outline">No storage</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ModeCard
          mode="password"
          title="Random password"
          description="Best for accounts saved in a password manager."
          active={config.mode === "password"}
          onClick={(mode) => patch({ mode })}
        />
        <ModeCard
          mode="passphrase"
          title="Memorable passphrase"
          description="Best when you need to type it manually."
          active={config.mode === "passphrase"}
          onClick={(mode) => patch({ mode })}
        />
      </div>

      <div className="mt-5 space-y-4">
        {config.mode === "password" ? (
          <>
            <SliderWithNumber
              label="Password length"
              hint="Use 16+ for important accounts."
              value={config.length}
              min={8}
              max={128}
              onChange={(length) => patch({ length })}
            />

            <div className="space-y-3">
              <FieldLabel label="Character sets" hint="Keep at least one enabled. More variety can increase entropy." />
              <div className="grid gap-3 sm:grid-cols-2">
                {passwordOptionLabels
                  .filter((option) => option.group === "charset")
                  .map((option) => (
                    <ToggleCard
                      key={option.key}
                      label={option.label}
                      help={option.help}
                      pressed={Boolean(config[option.key])}
                      onClick={() => togglePasswordOption(option.key)}
                    />
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <FieldLabel label="Readability" hint="Useful when the password needs to be typed from paper or another screen." />
              <div className="grid gap-3 sm:grid-cols-2">
                {passwordOptionLabels
                  .filter((option) => option.group === "readability")
                  .map((option) => (
                    <ToggleCard
                      key={option.key}
                      label={option.label}
                      help={option.help}
                      pressed={Boolean(config[option.key])}
                      onClick={() => togglePasswordOption(option.key)}
                    />
                  ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <SliderWithNumber
              label="Number of words"
              hint="Four words is a strong baseline; five or more is better for high-value accounts."
              value={config.wordCount}
              min={3}
              max={10}
              onChange={(wordCount) => patch({ wordCount })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
                <label htmlFor="password-generator-separator" className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Separator
                </label>
                <Select
                  id="password-generator-separator"
                  value={config.separator}
                  onChange={(event) => patch({ separator: event.target.value })}
                >
                  {passphraseSeparators.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <ToggleCard
                label="Capitalize words"
                help="Makes each word easier to scan."
                pressed={config.capitalizeWords}
                onClick={() => patch({ capitalizeWords: !config.capitalizeWords })}
              />
              <ToggleCard
                label="Include number"
                help="Adds one random number segment."
                pressed={config.includeNumber}
                onClick={() => patch({ includeNumber: !config.includeNumber })}
              />
              <ToggleCard
                label="Include symbol"
                help="Adds one random symbol segment."
                pressed={config.includeSymbol}
                onClick={() => patch({ includeSymbol: !config.includeSymbol })}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function PasswordGeneratorClient() {
  const [config, setConfig] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const regenerate = useCallback(() => {
    try {
      setValue(config.mode === "passphrase" ? generatePassphrase(config) : generatePassword(config));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate a secure value in this browser.");
    }
  }, [config]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const strength = value ? calculateStrength(value, config) : null;
  const annotatedCharacters = useMemo(() => annotatePassword(value), [value]);
  const copyLabel = config.mode === "passphrase" ? "Copy passphrase" : "Copy password";

  function patch(next: Partial<PasswordConfig>) {
    setConfig((current) => ({ ...current, ...next }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-md)] sm:p-6">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]">
            <div className="border-b border-[var(--color-border-subtle)] bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-accent-soft))] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Generated secret</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
                    Ready to copy
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">Browser-only</Badge>
                  <Badge variant="soft">Crypto API</Badge>
                  <Badge variant="outline">Not stored</Badge>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-4 shadow-[inset_0_1px_0_var(--color-code-border)] sm:p-5">
                <div className="flex min-h-[136px] select-all items-center whitespace-pre-wrap break-words font-mono text-[1.7rem] font-black leading-[1.35] tracking-[0.025em] text-[var(--color-code-text)] [overflow-wrap:anywhere] sm:min-h-[150px] sm:text-[2.05rem] lg:text-[2.35rem]">
                  <AnnotatedPassword characters={annotatedCharacters} />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CopyButton text={value} size="lg" disabled={!value} className="sm:min-w-[11rem]">
                  {copyLabel}
                </CopyButton>
                <Button variant="secondary" size="lg" onClick={regenerate} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <PasswordStrengthMeter strength={strength} />
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Character mix</h3>
                </div>
                <PasswordCharacterLegend />
              </div>

              {error ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm font-semibold leading-6 text-[var(--color-danger-text)]">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <SettingsPanel config={config} patch={patch} />
      </section>

      <PasswordSecuritySections />
    </div>
  );
}
