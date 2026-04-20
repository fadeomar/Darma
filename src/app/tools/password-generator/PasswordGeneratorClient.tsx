"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw, Check, Shield } from "lucide-react";
import {
  generatePassword,
  generatePassphrase,
  calculateStrength,
  annotatePassword,
} from "./generator";
import type { PasswordConfig, AnnotatedChar } from "./types";

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT: PasswordConfig = {
  mode: "password",
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  wordCount: 4,
  separator: "-",
  capitalizeWords: true,
  includeNumber: false,
  includeSymbol: false,
  seedText: "",
};

const SEPARATORS = [
  { label: "Hyphen  —", value: "-" },
  { label: "Underscore  _", value: "_" },
  { label: "Dot  .", value: "." },
  { label: "Space", value: " " },
  { label: "None", value: "" },
];

// ─── Small primitives ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-[var(--textColor)]/50">
      {children}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  sublabel,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/8 bg-white px-3 py-2.5 transition hover:border-black/15",
        disabled ? "pointer-events-none opacity-40" : "",
      ].join(" ")}
    >
      <span>
        <span className="text-sm font-semibold text-[var(--textColor)]">{label}</span>
        {sublabel && (
          <span className="ml-1.5 text-xs text-[var(--textColor)]/45 font-mono">{sublabel}</span>
        )}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--textColor)]" : "bg-black/20",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

// ─── Coloured password display ────────────────────────────────────────────────

const CHAR_COLORS: Record<AnnotatedChar["type"], string> = {
  lower:  "text-[var(--textColor)]",
  upper:  "text-blue-600",
  digit:  "text-amber-600",
  symbol: "text-purple-600",
};

function PasswordDisplay({ chars }: { chars: AnnotatedChar[] }) {
  return (
    <span className="font-mono break-all leading-relaxed tracking-wide">
      {chars.map((c, i) => (
        <span key={i} className={CHAR_COLORS[c.type]}>
          {c.char}
        </span>
      ))}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const base =
    size === "md"
      ? "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition"
      : "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition";

  return (
    <button
      onClick={handleCopy}
      className={[
        base,
        copied
          ? "bg-emerald-500 text-white"
          : "bg-[var(--textColor)] text-[var(--baseColor)] hover:opacity-80",
      ].join(" ")}
    >
      {copied ? (
        <Check className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />
      ) : (
        <Copy className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Strength bar ─────────────────────────────────────────────────────────────

function StrengthBar({ password, config }: { password: string; config: PasswordConfig }) {
  const strength = calculateStrength(password, config);

  const levelText: Record<string, string> = {
    "very-weak":   "text-red-600",
    "weak":        "text-orange-500",
    "fair":        "text-yellow-600",
    "strong":      "text-emerald-600",
    "very-strong": "text-emerald-700",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[var(--textColor)]/40" />
          <span className={["text-sm font-bold", levelText[strength.level]].join(" ")}>
            {strength.label}
          </span>
        </div>
        <span className="text-xs text-[var(--textColor)]/50 font-mono">
          {strength.entropy > 0 ? `${strength.entropy} bits` : ""}
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/8">
        <div
          className={["h-full rounded-full transition-all duration-500", strength.color].join(" ")}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      {/* Crack time */}
      {strength.crackTime !== "—" && (
        <p className="text-xs text-[var(--textColor)]/45">
          At 10 billion guesses/sec:{" "}
          <span className="font-semibold text-[var(--textColor)]/65">{strength.crackTime}</span>
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PasswordGeneratorClient() {
  const [config, setConfig] = useState<PasswordConfig>(DEFAULT);
  const [password, setPassword] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const run = useCallback((cfg: PasswordConfig) => {
    const next =
      cfg.mode === "passphrase"
        ? generatePassphrase(cfg)
        : generatePassword(cfg);
    setPassword(next);
    if (next) {
      setHistory((prev) => [next, ...prev.filter((p) => p !== next)].slice(0, 5));
    }
  }, []);

  // Generate on mount
  useEffect(() => {
    run(DEFAULT);
  }, [run]);

  const patch = (update: Partial<PasswordConfig>) => {
    const next = { ...config, ...update };
    setConfig(next);
    // Re-generate instantly on any setting change
    run(next);
    return next;
  };

  // Ensure at least one char set is always active (don't allow all off)
  const toggleCharSet = (key: keyof PasswordConfig, value: boolean) => {
    const next = { ...config, [key]: value };
    const anyOn = next.uppercase || next.lowercase || next.numbers || next.symbols;
    if (!anyOn) return; // block turning off the last one
    patch({ [key]: value });
  };

  const annotated = annotatePassword(password);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      {/* ── Left: output + strength ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-2xl border border-black/8 bg-black/3 p-1 self-start">
          {(["password", "passphrase"] as const).map((m) => (
            <button
              key={m}
              onClick={() => patch({ mode: m })}
              className={[
                "rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition",
                config.mode === m
                  ? "bg-[var(--textColor)] text-[var(--baseColor)]"
                  : "text-[var(--textColor)]/60 hover:text-[var(--textColor)]",
              ].join(" ")}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Password display */}
        <div className="rounded-2xl border border-black/10 bg-slate-50 p-5">
          <div className="min-h-[64px] text-xl leading-8 tracking-wide">
            {password ? (
              config.mode === "passphrase" ? (
                <span className="font-mono text-[var(--textColor)]">{password}</span>
              ) : (
                <PasswordDisplay chars={annotated} />
              )
            ) : (
              <span className="text-[var(--textColor)]/25 text-base italic">
                Set at least one character type to generate.
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <CopyBtn text={password} size="md" />
            <button
              onClick={() => run(config)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-[var(--textColor)] transition hover:bg-black/5"
            >
              <RefreshCw className="h-4 w-4" />
              New password
            </button>
            <span className="ml-auto text-xs font-mono text-[var(--textColor)]/35">
              {password.length} chars
            </span>
          </div>
        </div>

        {/* Strength */}
        {password && (
          <div className="rounded-2xl border border-black/8 bg-white/70 p-4">
            <StrengthBar password={password} config={config} />
          </div>
        )}

        {/* Colour key (password mode only) */}
        {config.mode === "password" && password && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs font-mono">
            {config.lowercase && <span className="text-[var(--textColor)]/60">a–z lowercase</span>}
            {config.uppercase && <span className="text-blue-600">A–Z uppercase</span>}
            {config.numbers   && <span className="text-amber-600">0–9 numbers</span>}
            {config.symbols   && <span className="text-purple-600">!@# symbols</span>}
          </div>
        )}

        {/* Recent passwords */}
        {history.length > 1 && (
          <div>
            <Label>Recent passwords</Label>
            <div className="space-y-1.5">
              {history.slice(1).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-white/60 px-3 py-2"
                >
                  <span className="truncate font-mono text-xs text-[var(--textColor)]/60">{p}</span>
                  <CopyBtn text={p} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {config.mode === "password" ? (
          <>
            {/* Length */}
            <div>
              <Label>Length — {config.length} characters</Label>
              <input
                type="range"
                min={6}
                max={128}
                value={config.length}
                onChange={(e) => patch({ length: Number(e.target.value) })}
                className="w-full accent-[var(--textColor)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[var(--textColor)]/40">
                <span>6</span>
                <span>128</span>
              </div>
            </div>

            {/* Character sets */}
            <div>
              <Label>Character sets</Label>
              <div className="space-y-1.5">
                <Toggle
                  checked={config.uppercase}
                  onChange={(v) => toggleCharSet("uppercase", v)}
                  label="Uppercase"
                  sublabel="A–Z"
                />
                <Toggle
                  checked={config.lowercase}
                  onChange={(v) => toggleCharSet("lowercase", v)}
                  label="Lowercase"
                  sublabel="a–z"
                />
                <Toggle
                  checked={config.numbers}
                  onChange={(v) => toggleCharSet("numbers", v)}
                  label="Numbers"
                  sublabel="0–9"
                />
                <Toggle
                  checked={config.symbols}
                  onChange={(v) => toggleCharSet("symbols", v)}
                  label="Symbols"
                  sublabel="!@#$"
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <Label>Options</Label>
              <div className="space-y-1.5">
                <Toggle
                  checked={config.excludeSimilar}
                  onChange={(v) => patch({ excludeSimilar: v })}
                  label="Exclude similar"
                  sublabel="l 1 I O 0"
                />
                <Toggle
                  checked={config.excludeAmbiguous}
                  onChange={(v) => patch({ excludeAmbiguous: v })}
                  label="Exclude ambiguous"
                  sublabel="{} [] () /"
                  disabled={!config.symbols}
                />
              </div>
            </div>

            {/* Seed text */}
            <div>
              <Label>Include your text</Label>
              <input
                type="text"
                value={config.seedText}
                placeholder="e.g. your name or number"
                maxLength={32}
                onChange={(e) => patch({ seedText: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[var(--textColor)] outline-none placeholder:text-[var(--textColor)]/30 focus:border-[var(--textColor)]/30 transition"
              />
              <p className="mt-1.5 text-[10px] leading-tight text-[var(--textColor)]/40">
                These characters are woven into the password at random positions.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Word count */}
            <div>
              <Label>Word count — {config.wordCount} words</Label>
              <input
                type="range"
                min={3}
                max={8}
                value={config.wordCount}
                onChange={(e) => patch({ wordCount: Number(e.target.value) })}
                className="w-full accent-[var(--textColor)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[var(--textColor)]/40">
                <span>3</span>
                <span>8</span>
              </div>
            </div>

            {/* Separator */}
            <div>
              <Label>Separator</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {SEPARATORS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => patch({ separator: s.value })}
                    className={[
                      "rounded-xl border py-2 text-xs font-semibold transition",
                      config.separator === s.value
                        ? "border-[var(--textColor)] bg-[var(--textColor)] text-[var(--baseColor)]"
                        : "border-black/10 bg-white text-[var(--textColor)]/70 hover:border-[var(--textColor)]/30",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Passphrase options */}
            <div>
              <Label>Options</Label>
              <div className="space-y-1.5">
                <Toggle
                  checked={config.capitalizeWords}
                  onChange={(v) => patch({ capitalizeWords: v })}
                  label="Capitalize words"
                />
                <Toggle
                  checked={config.includeNumber}
                  onChange={(v) => patch({ includeNumber: v })}
                  label="Add a number"
                />
                <Toggle
                  checked={config.includeSymbol}
                  onChange={(v) => patch({ includeSymbol: v })}
                  label="Add a symbol"
                  sublabel="!@#$%"
                />
              </div>
            </div>

            {/* Seed text (passphrase) */}
            <div>
              <Label>Include your text</Label>
              <input
                type="text"
                value={config.seedText}
                placeholder="e.g. your name or a word"
                maxLength={24}
                onChange={(e) => patch({ seedText: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[var(--textColor)] outline-none placeholder:text-[var(--textColor)]/30 focus:border-[var(--textColor)]/30 transition"
              />
              <p className="mt-1.5 text-[10px] leading-tight text-[var(--textColor)]/40">
                Added as a word segment between the random words.
              </p>
            </div>
          </>
        )}

        {/* Divider + generate */}
        <div className="mt-auto border-t border-black/8 pt-4">
          <button
            onClick={() => run(config)}
            className="w-full rounded-2xl bg-[var(--textColor)] py-3 text-sm font-black uppercase tracking-[0.15em] text-[var(--baseColor)] transition hover:opacity-80"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
