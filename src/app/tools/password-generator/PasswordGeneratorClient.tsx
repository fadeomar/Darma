"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Code2,
  Download,
  FileJson,
  FileText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge, Button, Card, CopyButton, Input, Select, Slider } from "@/components/ui";
import { WarningPanel, type WarningMessage } from "@/features/tools/components";
import { downloadBlobFile } from "@/features/tools/export/downloadBlob";
import { ToolMobileActions } from "@/features/tools/components/ToolMobileActions";
import { downloadTextFile } from "@/features/tools/export/downloadText";
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
import {
  DEFAULT_PASSWORD_CONFIG,
  PASSWORD_POLICIES,
  PASSWORD_PRESETS,
  buildPasswordAudit,
  buildPasswordEnvExample,
  buildPasswordJavaScriptSnippet,
  buildPasswordMarkdownReport,
  buildPasswordSummary,
  buildPasswordTypeScriptSnippet,
  createPasswordProject,
  parsePasswordProject,
  summarizePasswordAudit,
  type PasswordAuditCheck,
  type PasswordPolicyId,
} from "./studio";
import type { PasswordConfig, PasswordMode } from "./types";

type PasswordToggleKey =
  | "uppercase"
  | "lowercase"
  | "numbers"
  | "symbols"
  | "excludeSimilar"
  | "excludeAmbiguous";

const passwordOptionLabels: Array<{
  key: PasswordToggleKey;
  label: string;
  help: string;
  group: "charset" | "readability";
}> = [
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

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card padding="sm" className="min-w-0">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]" title={value}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{detail}</p>
    </Card>
  );
}

function PresetCard({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-md)] border p-3 text-left outline-none transition focus-visible:shadow-[var(--focus-ring)]",
        active
          ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
      )}
    >
      <span className="block text-sm font-bold text-[var(--color-text-primary)]">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{description}</span>
    </button>
  );
}

function SettingsPanel({
  config,
  policyId,
  activePreset,
  patch,
  setPolicyId,
  applyPreset,
}: {
  config: PasswordConfig;
  policyId: PasswordPolicyId;
  activePreset: string | null;
  patch: (next: Partial<PasswordConfig>) => void;
  setPolicyId: (policyId: PasswordPolicyId) => void;
  applyPreset: (id: string) => void;
}) {
  function togglePasswordOption(key: PasswordToggleKey) {
    const characterSetKeys: PasswordToggleKey[] = ["uppercase", "lowercase", "numbers", "symbols"];
    if (characterSetKeys.includes(key) && config[key] && getActiveCharacterSetCount(config) === 1) return;
    patch({ [key]: !config[key] } as Partial<PasswordConfig>);
  }

  return (
    <section data-tool-region="controls" className="order-1 rounded-[var(--radius-lg)] border border-[var(--color-tool-controls-border)] bg-[var(--color-tool-controls-bg)] p-5 shadow-[var(--shadow-tool-controls)] sm:p-6 lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-7.75rem)] lg:overflow-y-auto lg:overscroll-contain">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Policy and generator</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Settings</h2>
        </div>
        <Badge variant="outline">Secrets never exported</Badge>
      </div>

      <div className="mt-5 space-y-2">
        <label htmlFor="password-policy" className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Target policy
        </label>
        <Select id="password-policy" value={policyId} onChange={(event) => setPolicyId(event.target.value as PasswordPolicyId)}>
          {PASSWORD_POLICIES.map((policy) => (
            <option key={policy.id} value={policy.id}>
              {policy.label} — {policy.minimumEntropy}+ bits
            </option>
          ))}
        </Select>
        <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
          The selected profile controls readiness checks; it does not store or transmit the generated value.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <FieldLabel label="Practical presets" hint="Start from a use case, then customize only when the destination has specific requirements." />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {PASSWORD_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              title={preset.title}
              description={preset.description}
              active={activePreset === preset.id}
              onClick={() => applyPreset(preset.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ModeCard
          mode="password"
          title="Random password"
          description="Best for values stored and filled by a password manager."
          active={config.mode === "password"}
          onClick={(mode) => patch({ mode })}
        />
        <ModeCard
          mode="passphrase"
          title="Memorable passphrase"
          description="Best when a secret must be typed manually."
          active={config.mode === "passphrase"}
          onClick={(mode) => patch({ mode })}
        />
      </div>

      <div className="mt-5 space-y-4">
        {config.mode === "password" ? (
          <>
            <SliderWithNumber
              label="Password length"
              hint="Use the policy check rather than relying on a single universal minimum."
              value={config.length}
              min={8}
              max={128}
              onChange={(length) => patch({ length })}
            />

            <div className="space-y-3">
              <FieldLabel label="Character sets" hint="Keep at least one enabled. Confirm destination compatibility before enabling symbols." />
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
              hint="Random word count, not visual length, drives the passphrase entropy estimate."
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

        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4">
          <label htmlFor="password-generator-seed" className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-warning-text)]">
            Optional custom fragment
          </label>
          <Input
            id="password-generator-seed"
            value={config.seedText}
            maxLength={80}
            autoComplete="off"
            placeholder="Avoid names, dates, brands, or personal phrases"
            onChange={(event) => patch({ seedText: event.target.value })}
          />
          <p className="text-xs leading-5 text-[var(--color-warning-text)]">
            Custom text is predictable and counts as zero entropy. Leave this empty for important, privileged, or machine secrets.
          </p>
        </div>
      </div>
    </section>
  );
}

function auditVariant(severity: PasswordAuditCheck["severity"]): WarningMessage["severity"] {
  if (severity === "error") return "danger";
  if (severity === "pass") return "success";
  return severity;
}

function safeFilename(prefix: string, extension: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export default function PasswordGeneratorClient() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<PasswordConfig>(DEFAULT_PASSWORD_CONFIG);
  const [policyId, setPolicyId] = useState<PasswordPolicyId>("important");
  const [activePreset, setActivePreset] = useState<string | null>("everyday");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isPacking, setIsPacking] = useState(false);

  const secureRandomAvailable =
    typeof globalThis !== "undefined" && Boolean(globalThis.crypto?.getRandomValues);

  const regenerate = useCallback(() => {
    try {
      setValue(config.mode === "passphrase" ? generatePassphrase(config) : generatePassword(config));
      setError("");
    } catch (generationError) {
      setValue("");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate a secure value in this browser.",
      );
    }
  }, [config]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const strength = value ? calculateStrength(value, config) : null;
  const annotatedCharacters = useMemo(() => annotatePassword(value), [value]);
  const auditChecks = useMemo(
    () => buildPasswordAudit(config, strength, policyId, secureRandomAvailable),
    [config, policyId, secureRandomAvailable, strength],
  );
  const auditCounts = useMemo(() => summarizePasswordAudit(auditChecks), [auditChecks]);
  const summary = useMemo(
    () => buildPasswordSummary(config, strength, policyId, auditChecks),
    [auditChecks, config, policyId, strength],
  );
  const projectJson = useMemo(
    () => JSON.stringify(createPasswordProject(config, policyId), null, 2),
    [config, policyId],
  );
  const markdownReport = useMemo(
    () => buildPasswordMarkdownReport(config, strength, policyId, auditChecks),
    [auditChecks, config, policyId, strength],
  );
  const javascriptSnippet = useMemo(
    () => buildPasswordJavaScriptSnippet(config, policyId),
    [config, policyId],
  );
  const typescriptSnippet = useMemo(
    () => buildPasswordTypeScriptSnippet(config, policyId),
    [config, policyId],
  );
  const envExample = useMemo(() => buildPasswordEnvExample(policyId), [policyId]);
  const copyLabel = config.mode === "passphrase" ? "Copy passphrase" : "Copy password";

  function patch(next: Partial<PasswordConfig>) {
    setActivePreset(null);
    setImportMessage("");
    setConfig((current) => ({ ...current, ...next }));
  }

  function applyPreset(id: string) {
    const preset = PASSWORD_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setConfig({ ...preset.config });
    setPolicyId(preset.policyId);
    setActivePreset(id);
    setImportMessage(`Applied ${preset.title}. Review the production checks before using the generated value.`);
  }

  function reset() {
    setConfig(DEFAULT_PASSWORD_CONFIG);
    setPolicyId("important");
    setActivePreset("everyday");
    setImportMessage("");
  }

  async function importProject(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setImportMessage("Import failed: policy files must be 1 MB or smaller.");
      return;
    }

    try {
      const project = parsePasswordProject(await file.text());
      setConfig(project.config);
      setPolicyId(project.policyId);
      setActivePreset(null);
      setImportMessage(`Imported ${file.name}. The file contained settings only; no secret was imported.`);
    } catch (importError) {
      setImportMessage(
        `Import failed: ${importError instanceof Error ? importError.message : "Unknown policy format."}`,
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function downloadProductionPack() {
    setIsPacking(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      zip.file("password-policy.json", projectJson);
      zip.file("password-policy-report.md", markdownReport);
      zip.file("password-policy.js", javascriptSnippet);
      zip.file("password-policy.ts", typescriptSnippet);
      zip.file("secret.env.example", envExample);
      zip.file(
        "SECURITY.md",
        [
          "# Secret handling",
          "",
          "This production pack deliberately excludes the generated password or passphrase.",
          "",
          "- Generate the real secret only in the environment where it will be stored.",
          "- Use a password manager or deployment secret manager.",
          "- Never commit real secrets to source control.",
          "- Rotate exposed or shared secrets immediately.",
          "- Enable multi-factor authentication for human accounts.",
          "",
        ].join("\n"),
      );
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlobFile({ blob, filename: safeFilename("darma-password-policy-pack", "zip") });
    } finally {
      setIsPacking(false);
    }
  }

  const warningMessages: WarningMessage[] = auditChecks.map((check) => ({
    id: check.id,
    title: check.title,
    message: check.message,
    severity: auditVariant(check.severity),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(320px,var(--tool-controls-width))_minmax(0,1fr)] lg:items-start">
        <div id="password-result" data-tool-region="result" className="order-2 rounded-[var(--radius-xl)] border border-[var(--color-tool-result-border)] bg-[var(--color-tool-result-bg)] p-3 shadow-[var(--shadow-tool-result)] sm:p-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-tool-result-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-tool-result-border)] bg-[linear-gradient(135deg,var(--color-tool-result-header),var(--color-accent-soft))] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Generated secret</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
                    {error ? "Generation unavailable" : "Ready to copy"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">Browser-only</Badge>
                  <Badge variant="soft">Web Crypto</Badge>
                  <Badge variant="outline">Not stored</Badge>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)] p-4 shadow-[inset_0_1px_0_var(--color-code-border)] sm:p-5">
                <div className="flex min-h-[116px] select-all items-center whitespace-pre-wrap break-words font-mono text-[1.45rem] font-black leading-[1.35] tracking-[0.025em] text-[var(--color-code-text)] [overflow-wrap:anywhere] sm:min-h-[132px] sm:text-[1.85rem] lg:text-[2.05rem]">
                  {value ? <AnnotatedPassword characters={annotatedCharacters} /> : <span className="text-base font-semibold text-[var(--color-text-tertiary)]">No secure value available.</span>}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CopyButton text={value} size="lg" disabled={!value} className="sm:min-w-[11rem]">
                  {copyLabel}
                </CopyButton>
                <Button variant="secondary" size="lg" onClick={regenerate} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
                  Regenerate
                </Button>
                <Button variant="ghost" size="lg" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
                  Reset
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
                <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm font-semibold leading-6 text-[var(--color-danger-text)]" role="alert">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <SettingsPanel
          config={config}
          policyId={policyId}
          activePreset={activePreset}
          patch={patch}
          setPolicyId={(nextPolicy) => {
            setPolicyId(nextPolicy);
            setActivePreset(null);
            setImportMessage("");
          }}
          applyPreset={applyPreset}
        />
      </section>

      <ToolMobileActions>
        <CopyButton text={value} disabled={!value}>{copyLabel}</CopyButton>
        <Button variant="secondary" onClick={regenerate} leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>Regenerate</Button>
      </ToolMobileActions>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Production audit</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Security readiness</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                The audit compares current settings with the selected use case. It never checks the secret against an online breach service or sends it anywhere.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {auditCounts.error ? <Badge variant="danger">{auditCounts.error} error</Badge> : null}
              {auditCounts.warning ? <Badge variant="warning">{auditCounts.warning} warning</Badge> : null}
              <Badge variant="success">{auditCounts.pass} passed</Badge>
            </div>
          </div>
          <WarningPanel messages={warningMessages} className="mt-5" />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Policy portability</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Import and export</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Downloads contain settings, code starters, and audit guidance only. The generated secret is never included.
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void importProject(event.target.files?.[0])}
          />

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Button variant="secondary" onClick={() => importInputRef.current?.click()} leftIcon={<Upload className="h-4 w-4" aria-hidden />}>
              Import policy JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadTextFile({ content: projectJson, filename: safeFilename("darma-password-policy", "json"), mimeType: "application/json;charset=utf-8" })}
              leftIcon={<FileJson className="h-4 w-4" aria-hidden />}
            >
              Policy JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadTextFile({ content: markdownReport, filename: safeFilename("darma-password-policy-report", "md"), mimeType: "text/markdown;charset=utf-8" })}
              leftIcon={<FileText className="h-4 w-4" aria-hidden />}
            >
              Markdown report
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadTextFile({ content: javascriptSnippet, filename: safeFilename("darma-password-policy", "js"), mimeType: "text/javascript;charset=utf-8" })}
              leftIcon={<Code2 className="h-4 w-4" aria-hidden />}
            >
              JavaScript
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadTextFile({ content: typescriptSnippet, filename: safeFilename("darma-password-policy", "ts"), mimeType: "text/typescript;charset=utf-8" })}
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
            >
              TypeScript
            </Button>
            <Button
              onClick={() => void downloadProductionPack()}
              disabled={isPacking}
              leftIcon={<Archive className="h-4 w-4" aria-hidden />}
            >
              {isPacking ? "Packing…" : "ZIP production pack"}
            </Button>
          </div>

          {importMessage ? (
            <p
              className={cn(
                "mt-4 text-xs leading-5",
                importMessage.startsWith("Import failed")
                  ? "text-[var(--color-danger-text)]"
                  : "text-[var(--color-success-text)]",
              )}
              role="status"
            >
              {importMessage}
            </p>
          ) : null}
        </div>
      </section>

      <PasswordSecuritySections />
    </div>
  );
}
