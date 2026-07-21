/**
 * scan-explorer-secrets.ts
 *
 * Public-repository safety scan for the generated Explorer content. No third-
 * party scanner (gitleaks/trufflehog) is available in this environment, so this
 * implements GitHub-secret-scanning-compatible provider patterns plus a few
 * heuristics.
 *
 * - HIGH-confidence provider credentials -> reported as blocking (exit 2).
 * - Heuristic hits (generic "password=", emails) -> warnings only, because
 *   user-submitted HTML/CSS/JS demos legitimately contain such words.
 *
 * Secret VALUES are never printed; matches are redacted.
 *
 * Usage: tsx scripts/content/scan-explorer-secrets.ts [--out <report.json>]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

type Rule = { id: string; re: RegExp; severity: "high" | "warn" };

const RULES: Rule[] = [
  { id: "private-key-block", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g, severity: "high" },
  { id: "aws-access-key-id", re: /\bAKIA[0-9A-Z]{16}\b/g, severity: "high" },
  { id: "aws-secret-access-key", re: /\baws_secret_access_key\s*[:=]\s*['"]?[A-Za-z0-9/+]{40}\b/gi, severity: "high" },
  { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, severity: "high" },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_\-]{35}\b/g, severity: "high" },
  { id: "slack-token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, severity: "high" },
  { id: "stripe-secret-key", re: /\bsk_live_[0-9a-zA-Z]{24,}\b/g, severity: "high" },
  { id: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, severity: "high" },
  { id: "db-connection-string-with-credentials", re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:@/"']+:[^\s:@/"']+@[^\s/"']+/gi, severity: "high" },
  { id: "env-database-url-assignment", re: /\bDATABASE_URL\s*=\s*['"]?[a-z]+:\/\//gi, severity: "high" },
  { id: "auth-secret-assignment", re: /\bAUTH_SECRET\s*=\s*['"]?\S{8,}/g, severity: "high" },
  // Heuristics (non-blocking):
  { id: "generic-secret-assignment", re: /\b(?:api[_-]?key|secret|token|passwd|password|access[_-]?token)['"]?\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/gi, severity: "warn" },
  { id: "email-address", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, severity: "warn" },
];

function redact(match: string): string {
  const clean = match.replace(/\s+/g, " ").trim();
  if (clean.length <= 8) return "*".repeat(clean.length);
  return `${clean.slice(0, 4)}…${clean.slice(-2)} (len=${clean.length})`;
}

function stripDataUris(text: string): string {
  // base64 image/font blobs create noise; drop their payloads before scanning.
  return text.replace(/data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, "data:<omitted-base64>");
}

function main() {
  const argv = process.argv.slice(2);
  const repoRoot = process.cwd();
  let out = join(repoRoot, "migration-backups", "private", "secret-scan-report.json");
  for (let i = 0; i < argv.length; i++) if (argv[i] === "--out") out = resolve(argv[++i]);

  const contentDir = join(repoRoot, "content", "explorer");
  const itemsDir = join(contentDir, "items");
  const files: string[] = [];
  if (existsSync(itemsDir)) for (const f of readdirSync(itemsDir)) if (f.endsWith(".json")) files.push(join(itemsDir, f));
  for (const f of ["manifest.json", "element-columns.json", "export-checksums.json"]) {
    const p = join(contentDir, f);
    if (existsSync(p)) files.push(p);
  }

  const findings: Array<{ rule: string; severity: string; file: string; count: number; sample: string }> = [];
  const byRule = new Map<string, { severity: string; count: number; files: Set<string> }>();

  for (const file of files) {
    const text = stripDataUris(readFileSync(file, "utf8"));
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      const matches = text.match(rule.re);
      if (matches && matches.length) {
        const rel = file.replace(repoRoot + "\\", "").replace(repoRoot + "/", "").replace(/\\/g, "/");
        findings.push({ rule: rule.id, severity: rule.severity, file: rel, count: matches.length, sample: redact(matches[0]) });
        const agg = byRule.get(rule.id) ?? { severity: rule.severity, count: 0, files: new Set<string>() };
        agg.count += matches.length;
        agg.files.add(rel);
        byRule.set(rule.id, agg);
      }
    }
  }

  const highFindings = findings.filter((f) => f.severity === "high");
  const warnFindings = findings.filter((f) => f.severity === "warn");

  const report = {
    schemaVersion: 1,
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    rulesEvaluated: RULES.map((r) => r.id),
    summary: [...byRule.entries()].map(([rule, v]) => ({ rule, severity: v.severity, matches: v.count, files: v.files.size })),
    highConfidenceFindings: highFindings,
    heuristicFindings: warnFindings.map((f) => ({ ...f, sample: f.rule === "email-address" ? "<redacted-email>" : f.sample })),
    highConfidenceCount: highFindings.length,
    heuristicCount: warnFindings.length,
    pass: highFindings.length === 0,
  };
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`Secret scan: ${files.length} files scanned.`);
  console.log(`  high-confidence findings: ${highFindings.length}`);
  console.log(`  heuristic findings (warn): ${warnFindings.length}`);
  for (const s of report.summary) console.log(`    ${s.severity.toUpperCase()} ${s.rule}: ${s.matches} match(es) in ${s.files} file(s)`);
  console.log(`  report written: ${out}`);
  if (highFindings.length) {
    console.error("\nHIGH-CONFIDENCE secrets detected — do NOT commit/push these files:");
    for (const f of highFindings.slice(0, 20)) console.error(`  - [${f.rule}] ${f.file} (${f.count}) ${f.sample}`);
    process.exit(2);
  }
  console.log("\nSECRET SCAN PASS (no high-confidence provider credentials).");
}

main();
