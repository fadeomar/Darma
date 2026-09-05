import type { PasswordConfig, StrengthResult } from "./types";

export type PasswordPolicyId = "standard" | "important" | "privileged" | "machine";
export type PasswordAuditSeverity = "error" | "warning" | "info" | "pass";

export type PasswordAuditCheck = {
  id: string;
  title: string;
  message: string;
  severity: PasswordAuditSeverity;
};

export type PasswordSummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type PasswordPolicyProfile = {
  id: PasswordPolicyId;
  label: string;
  description: string;
  minimumEntropy: number;
  minimumPasswordLength: number;
  minimumWords: number;
};

export type PasswordPreset = {
  id: string;
  title: string;
  description: string;
  policyId: PasswordPolicyId;
  config: PasswordConfig;
};

export type PasswordProjectFile = {
  schema: "darma.password-policy";
  version: 1;
  exportedAt: string;
  policyId: PasswordPolicyId;
  config: PasswordConfig;
  note: string;
};

const PASSWORD_MODES = ["password", "passphrase"] as const;
const POLICY_IDS = ["standard", "important", "privileged", "machine"] as const;
const SEPARATORS = ["-", "_", ".", " ", "random"] as const;

type JsonRecord = Record<string, unknown>;

export const DEFAULT_PASSWORD_CONFIG: PasswordConfig = {
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

export const PASSWORD_POLICIES: PasswordPolicyProfile[] = [
  {
    id: "standard",
    label: "Standard account",
    description: "General websites and low-risk personal accounts.",
    minimumEntropy: 60,
    minimumPasswordLength: 14,
    minimumWords: 4,
  },
  {
    id: "important",
    label: "Important account",
    description: "Primary email, cloud storage, and accounts that can reset others.",
    minimumEntropy: 80,
    minimumPasswordLength: 18,
    minimumWords: 5,
  },
  {
    id: "privileged",
    label: "Admin or financial",
    description: "Administrative access, banking, infrastructure, and password managers.",
    minimumEntropy: 100,
    minimumPasswordLength: 22,
    minimumWords: 6,
  },
  {
    id: "machine",
    label: "Machine secret",
    description: "API keys, service credentials, automation, and non-human entry.",
    minimumEntropy: 128,
    minimumPasswordLength: 32,
    minimumWords: 8,
  },
];

export const PASSWORD_PRESETS: PasswordPreset[] = [
  {
    id: "everyday",
    title: "Everyday account",
    description: "18 random characters with a broad, readable character set.",
    policyId: "standard",
    config: { ...DEFAULT_PASSWORD_CONFIG },
  },
  {
    id: "important",
    title: "Important account",
    description: "24 random characters for email, cloud, and account recovery.",
    policyId: "important",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 24 },
  },
  {
    id: "privileged",
    title: "Admin or finance",
    description: "28 random characters for privileged and high-value access.",
    policyId: "privileged",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 28, excludeSimilar: false },
  },
  {
    id: "machine",
    title: "Service secret",
    description: "40 random characters for systems that do not require manual typing.",
    policyId: "machine",
    config: {
      ...DEFAULT_PASSWORD_CONFIG,
      length: 40,
      excludeSimilar: false,
      excludeAmbiguous: false,
    },
  },
  {
    id: "memorable",
    title: "Memorable passphrase",
    description: "Five randomized words with a number for manual entry.",
    policyId: "important",
    config: {
      ...DEFAULT_PASSWORD_CONFIG,
      mode: "passphrase",
      wordCount: 5,
      separator: "-",
      capitalizeWords: true,
      includeNumber: true,
      includeSymbol: false,
      seedText: "",
    },
  },
  {
    id: "password-manager",
    title: "Password manager default",
    description: "20 random characters for accounts saved and autofilled by a password manager.",
    policyId: "important",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 20 },
  },
  {
    id: "legacy-compatible",
    title: "Legacy-compatible login",
    description: "20 characters without symbols for older sites that reject punctuation; review the destination policy first.",
    policyId: "important",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 20, symbols: false },
  },
  {
    id: "shared-wifi",
    title: "Shared Wi-Fi password",
    description: "24 readable random characters for a network password that may need occasional manual entry.",
    policyId: "important",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 24, excludeSimilar: true, excludeAmbiguous: true },
  },
  {
    id: "database",
    title: "Database credential",
    description: "40 random characters for application-to-database authentication stored in a secret manager.",
    policyId: "machine",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 40, excludeSimilar: false, excludeAmbiguous: false },
  },
  {
    id: "cicd",
    title: "CI/CD secret",
    description: "48 random characters for automation credentials and deployment pipelines.",
    policyId: "machine",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 48, excludeSimilar: false, excludeAmbiguous: false },
  },
  {
    id: "bootstrap",
    title: "Temporary bootstrap login",
    description: "22 random characters for a one-time setup credential that should be rotated after first use.",
    policyId: "privileged",
    config: { ...DEFAULT_PASSWORD_CONFIG, length: 22 },
  },
  {
    id: "typed-passphrase",
    title: "Strong typed passphrase",
    description: "Six randomized words for an important credential that a human may need to enter manually.",
    policyId: "privileged",
    config: { ...DEFAULT_PASSWORD_CONFIG, mode: "passphrase", wordCount: 6, separator: "-", capitalizeWords: true, includeNumber: true, includeSymbol: true, seedText: "" },
  },
];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function choice<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cleanString(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\u0000/g, "").slice(0, maxLength);
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function normalizePasswordPolicyId(value: unknown, fallback: PasswordPolicyId = "important"): PasswordPolicyId {
  return choice(value, fallback, POLICY_IDS);
}

export function normalizePasswordConfig(input: unknown, fallback: PasswordConfig = DEFAULT_PASSWORD_CONFIG): PasswordConfig {
  const source = isRecord(input) ? input : {};
  return {
    mode: choice(source.mode, fallback.mode, PASSWORD_MODES),
    length: clampInteger(source.length, fallback.length, 8, 128),
    uppercase: cleanBoolean(source.uppercase, fallback.uppercase),
    lowercase: cleanBoolean(source.lowercase, fallback.lowercase),
    numbers: cleanBoolean(source.numbers, fallback.numbers),
    symbols: cleanBoolean(source.symbols, fallback.symbols),
    excludeSimilar: cleanBoolean(source.excludeSimilar, fallback.excludeSimilar),
    excludeAmbiguous: cleanBoolean(source.excludeAmbiguous, fallback.excludeAmbiguous),
    wordCount: clampInteger(source.wordCount, fallback.wordCount, 3, 10),
    separator: choice(source.separator, fallback.separator, SEPARATORS),
    capitalizeWords: cleanBoolean(source.capitalizeWords, fallback.capitalizeWords),
    includeNumber: cleanBoolean(source.includeNumber, fallback.includeNumber),
    includeSymbol: cleanBoolean(source.includeSymbol, fallback.includeSymbol),
    seedText: cleanString(source.seedText, fallback.seedText, 80),
  };
}

export function createPasswordProject(
  config: PasswordConfig,
  policyId: PasswordPolicyId,
  exportedAt = new Date().toISOString(),
): PasswordProjectFile {
  return {
    schema: "darma.password-policy",
    version: 1,
    exportedAt,
    policyId: normalizePasswordPolicyId(policyId),
    config: normalizePasswordConfig(config),
    note: "This policy file intentionally excludes the generated password or passphrase.",
  };
}

export function parsePasswordProject(input: string): { config: PasswordConfig; policyId: PasswordPolicyId } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("The policy file must contain a JSON object.");
  if (parsed.schema !== "darma.password-policy") throw new Error("This is not a Darma password policy file.");
  if (parsed.version !== 1) throw new Error("This password policy version is not supported.");

  return {
    config: normalizePasswordConfig(parsed.config),
    policyId: normalizePasswordPolicyId(parsed.policyId),
  };
}

export function getPasswordPolicy(policyId: PasswordPolicyId): PasswordPolicyProfile {
  return PASSWORD_POLICIES.find((policy) => policy.id === policyId) ?? PASSWORD_POLICIES[1];
}

function enabledCharacterSets(config: PasswordConfig): number {
  return [config.uppercase, config.lowercase, config.numbers, config.symbols].filter(Boolean).length;
}

export function buildPasswordAudit(
  config: PasswordConfig,
  strength: StrengthResult | null,
  policyId: PasswordPolicyId,
  secureRandomAvailable: boolean,
): PasswordAuditCheck[] {
  const policy = getPasswordPolicy(policyId);
  const checks: PasswordAuditCheck[] = [];
  const entropy = strength?.entropy ?? 0;

  checks.push(
    secureRandomAvailable
      ? {
          id: "rng",
          title: "Secure random source",
          message: "The browser Web Crypto API is available. Generation fails closed if secure randomness is unavailable.",
          severity: "pass",
        }
      : {
          id: "rng",
          title: "Secure random source",
          message: "The browser Web Crypto API is unavailable. Do not use generated values from this environment.",
          severity: "error",
        },
  );

  if (entropy >= policy.minimumEntropy) {
    checks.push({
      id: "entropy",
      title: `${policy.label} entropy target`,
      message: `${entropy} estimated bits meets the ${policy.minimumEntropy}-bit target for this policy.`,
      severity: "pass",
    });
  } else {
    const gap = policy.minimumEntropy - entropy;
    checks.push({
      id: "entropy",
      title: `${policy.label} entropy target`,
      message: `${entropy} estimated bits is ${gap} bit${gap === 1 ? "" : "s"} below the ${policy.minimumEntropy}-bit target. Increase length or word count.`,
      severity: gap >= 24 ? "error" : "warning",
    });
  }

  if (config.mode === "password") {
    const sets = enabledCharacterSets(config);
    if (sets === 0) {
      checks.push({
        id: "character-sets",
        title: "Character set",
        message: "At least one random character set must be enabled.",
        severity: "error",
      });
    } else if (sets === 1) {
      checks.push({
        id: "character-sets",
        title: "Character diversity",
        message: "Only one character set is enabled. Length can compensate, but broader sets are preferable when the destination accepts them.",
        severity: "warning",
      });
    } else {
      checks.push({
        id: "character-sets",
        title: "Character diversity",
        message: `${sets} character sets are enabled. Verify that the destination accepts every selected symbol type.`,
        severity: sets >= 3 ? "pass" : "info",
      });
    }

    checks.push({
      id: "length",
      title: "Password length",
      message:
        config.length >= policy.minimumPasswordLength
          ? `${config.length} characters meets the ${policy.minimumPasswordLength}-character baseline for this policy.`
          : `${config.length} characters is below the ${policy.minimumPasswordLength}-character baseline for this policy.`,
      severity: config.length >= policy.minimumPasswordLength ? "pass" : "warning",
    });
  } else {
    checks.push({
      id: "word-count",
      title: "Passphrase word count",
      message:
        config.wordCount >= policy.minimumWords
          ? `${config.wordCount} random words meets the ${policy.minimumWords}-word baseline for this policy.`
          : `${config.wordCount} random words is below the ${policy.minimumWords}-word baseline for this policy.`,
      severity: config.wordCount >= policy.minimumWords ? "pass" : "warning",
    });

    if (policyId === "machine") {
      checks.push({
        id: "mode-fit",
        title: "Machine-secret format",
        message: "Use random password mode for service credentials. Passphrases are optimized for human entry, not compact machine secrets.",
        severity: "error",
      });
    } else {
      checks.push({
        id: "mode-fit",
        title: "Human-entry format",
        message: "A randomized passphrase is suitable when the secret must be typed manually. Store it in a password manager after use.",
        severity: "pass",
      });
    }
  }

  if (config.seedText.trim()) {
    checks.push({
      id: "seed",
      title: "Custom seed text",
      message: "Seed text is predictable and contributes no estimated entropy. Remove names, dates, phrases, or other personal patterns for important secrets.",
      severity: policyId === "standard" ? "warning" : "error",
    });
  } else {
    checks.push({
      id: "seed",
      title: "Predictable personal text",
      message: "No custom seed text is included in the generated value.",
      severity: "pass",
    });
  }

  checks.push({
    id: "handling",
    title: "Secret handling",
    message: "Use the value once, save it in a trusted password manager, enable multi-factor authentication, and never send it through chat or plain-text documents.",
    severity: "info",
  });

  checks.push({
    id: "export-safety",
    title: "Safe exports",
    message: "Policy exports contain settings and audit guidance only. The generated secret is deliberately excluded from every downloaded file and ZIP pack.",
    severity: "pass",
  });

  return checks;
}

export function summarizePasswordAudit(checks: PasswordAuditCheck[]) {
  return checks.reduce(
    (summary, check) => {
      summary[check.severity] += 1;
      return summary;
    },
    { error: 0, warning: 0, info: 0, pass: 0 },
  );
}

export function buildPasswordSummary(
  config: PasswordConfig,
  strength: StrengthResult | null,
  policyId: PasswordPolicyId,
  checks: PasswordAuditCheck[],
): PasswordSummaryCard[] {
  const policy = getPasswordPolicy(policyId);
  const counts = summarizePasswordAudit(checks);
  const ready = counts.error === 0 && counts.warning === 0;
  const unit = config.mode === "password" ? `${config.length} chars` : `${config.wordCount} words`;

  return [
    {
      label: "Mode",
      value: config.mode === "password" ? "Random password" : "Passphrase",
      detail: unit,
    },
    {
      label: "Estimated entropy",
      value: `${strength?.entropy ?? 0} bits`,
      detail: strength?.label ?? "Not generated",
    },
    {
      label: "Target policy",
      value: policy.label,
      detail: `${policy.minimumEntropy}-bit minimum`,
    },
    {
      label: "Readiness",
      value: counts.error ? `${counts.error} error${counts.error === 1 ? "" : "s"}` : ready ? "Ready" : `${counts.warning} warning${counts.warning === 1 ? "" : "s"}`,
      detail: `${counts.pass} checks passed`,
    },
  ];
}

export function buildPasswordMarkdownReport(
  config: PasswordConfig,
  strength: StrengthResult | null,
  policyId: PasswordPolicyId,
  checks: PasswordAuditCheck[],
  generatedAt = new Date().toISOString(),
): string {
  const policy = getPasswordPolicy(policyId);
  const settings =
    config.mode === "password"
      ? [
          `- Length: ${config.length}`,
          `- Uppercase: ${config.uppercase ? "yes" : "no"}`,
          `- Lowercase: ${config.lowercase ? "yes" : "no"}`,
          `- Numbers: ${config.numbers ? "yes" : "no"}`,
          `- Symbols: ${config.symbols ? "yes" : "no"}`,
          `- Exclude similar: ${config.excludeSimilar ? "yes" : "no"}`,
          `- Exclude ambiguous symbols: ${config.excludeAmbiguous ? "yes" : "no"}`,
        ]
      : [
          `- Random words: ${config.wordCount}`,
          `- Separator: ${config.separator === " " ? "space" : config.separator}`,
          `- Capitalize words: ${config.capitalizeWords ? "yes" : "no"}`,
          `- Include number: ${config.includeNumber ? "yes" : "no"}`,
          `- Include symbol: ${config.includeSymbol ? "yes" : "no"}`,
        ];

  return [
    "# Darma Password Policy Report",
    "",
    `Generated: ${generatedAt}`,
    "",
    "> The generated password or passphrase is intentionally excluded from this report.",
    "",
    "## Target policy",
    "",
    `- Profile: ${policy.label}`,
    `- Intended use: ${policy.description}`,
    `- Minimum entropy: ${policy.minimumEntropy} bits`,
    "",
    "## Generator settings",
    "",
    `- Mode: ${config.mode}`,
    ...settings,
    `- Custom seed text present: ${config.seedText.trim() ? "yes — remove for important secrets" : "no"}`,
    "",
    "## Strength estimate",
    "",
    `- Estimated entropy: ${strength?.entropy ?? 0} bits`,
    `- Rating: ${strength?.label ?? "Unavailable"}`,
    `- Illustrative offline crack time: ${strength?.crackTime ?? "Unavailable"}`,
    "",
    "## Production checks",
    "",
    ...checks.map((check) => `- **${check.severity.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "## Handling checklist",
    "",
    "- Generate a unique value for each account or service.",
    "- Save it directly in a trusted password manager.",
    "- Enable multi-factor authentication where available.",
    "- Never store real secrets in source control, tickets, chat, screenshots, or this report.",
    "",
  ].join("\n");
}

function serializedPolicyConfig(config: PasswordConfig, policyId: PasswordPolicyId) {
  return JSON.stringify(
    {
      policy: getPasswordPolicy(policyId),
      generator: normalizePasswordConfig(config),
      generatedSecretIncluded: false,
    },
    null,
    2,
  );
}

export function buildPasswordJavaScriptSnippet(config: PasswordConfig, policyId: PasswordPolicyId): string {
  return [
    "// Darma password policy configuration.",
    "// Generate the real secret at runtime and never commit it to source control.",
    `export const passwordPolicy = ${serializedPolicyConfig(config, policyId)};`,
    "",
    "export function secureRandomIndex(max) {",
    "  if (!Number.isInteger(max) || max <= 0) throw new TypeError(\"max must be a positive integer\");",
    "  const cryptoSource = globalThis.crypto;",
    "  if (!cryptoSource?.getRandomValues) throw new Error(\"Web Crypto is required\");",
    "  const limit = Math.floor(0x100000000 / max) * max;",
    "  const buffer = new Uint32Array(1);",
    "  do cryptoSource.getRandomValues(buffer); while (buffer[0] >= limit);",
    "  return buffer[0] % max;",
    "}",
    "",
  ].join("\n");
}

export function buildPasswordTypeScriptSnippet(config: PasswordConfig, policyId: PasswordPolicyId): string {
  return [
    "// Darma password policy configuration.",
    "// This file contains policy settings only — never generated secrets.",
    "export type PasswordGeneratorMode = \"password\" | \"passphrase\";",
    "",
    "export interface PasswordPolicyConfig {",
    "  policy: {",
    "    id: string;",
    "    label: string;",
    "    description: string;",
    "    minimumEntropy: number;",
    "    minimumPasswordLength: number;",
    "    minimumWords: number;",
    "  };",
    "  generator: {",
    "    mode: PasswordGeneratorMode;",
    "    length: number;",
    "    uppercase: boolean;",
    "    lowercase: boolean;",
    "    numbers: boolean;",
    "    symbols: boolean;",
    "    excludeSimilar: boolean;",
    "    excludeAmbiguous: boolean;",
    "    wordCount: number;",
    "    separator: string;",
    "    capitalizeWords: boolean;",
    "    includeNumber: boolean;",
    "    includeSymbol: boolean;",
    "    seedText: string;",
    "  };",
    "  generatedSecretIncluded: false;",
    "}",
    "",
    `export const passwordPolicy = ${serializedPolicyConfig(config, policyId)} as const satisfies PasswordPolicyConfig;`,
    "",
  ].join("\n");
}

export function buildPasswordEnvExample(policyId: PasswordPolicyId): string {
  const policy = getPasswordPolicy(policyId);
  return [
    "# Secret value intentionally blank.",
    "# Generate and inject it through your deployment platform or secret manager.",
    `# Target policy: ${policy.label} (${policy.minimumEntropy}+ estimated bits)`,
    "APP_SECRET=",
    "",
  ].join("\n");
}
