/**
 * build-export-report.ts
 *
 * Merges the machine validation report (content/explorer/export-report.json,
 * produced by validate-explorer-export.ts) with an operational metadata file
 * (backups, restore test, tool versions, consistency guard, secret scan, tests)
 * and emits:
 *   - an augmented content/explorer/export-report.json
 *   - a human-readable docs/migrations/explorer-db-export-report.md
 *
 * No secrets or filesystem paths of the secure backup dir are included.
 *
 * Usage: tsx scripts/content/build-export-report.ts --meta <meta.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const repoRoot = process.cwd();
const contentDir = join(repoRoot, "content", "explorer");
const metaPath = resolve(arg("--meta") ?? join(repoRoot, "migration-backups", "private", "migration-meta.json"));

const validation = JSON.parse(readFileSync(join(contentDir, "export-report.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(contentDir, "manifest.json"), "utf8"));
const columns = JSON.parse(readFileSync(join(contentDir, "element-columns.json"), "utf8"));
const meta = JSON.parse(readFileSync(metaPath, "utf8"));

const finalPass =
  validation.pass === true &&
  meta.consistency?.result === "PASS" &&
  meta.restore?.result === "PASS" &&
  meta.secretScan?.result === "PASS";

const merged = {
  ...validation,
  environment: meta.environment,
  table: manifest.table,
  columnCount: columns.columns.length,
  columns: columns.columns.map((c: { column_name: string }) => c.column_name),
  counts: {
    ...validation.counts,
    total: manifest.total,
    ...manifest.counts,
  },
  consistency: meta.consistency,
  backups: meta.backups,
  restore: meta.restore,
  secretScan: meta.secretScan,
  tests: meta.tests,
  finalResult: finalPass ? "PASS" : "FAIL",
};
writeFileSync(join(contentDir, "export-report.json"), JSON.stringify(merged, null, 2) + "\n", "utf8");

const p = validation.parity;
const s = validation.slugs;
const c = merged.counts;

const md = `# Explorer DB → JSON Export Report (Phase 1)

> **Scope:** lossless export only. No runtime cutover, no UI change, no schema
> migration, no database deletion, no record modification. \`reviewed\`/\`deleted\`
> are preserved as-is (not converted to a \`status\` field).

- **Validated at:** ${validation.validatedAt}
- **Source provider:** ${meta.environment.provider}
- **Source table:** \`${merged.table}\`
- **Validation source:** ${validation.source}
- **Final result:** **${merged.finalResult}**

## Environment

| Tool | Version |
|---|---|
| PostgreSQL server | ${meta.environment.postgresServerVersion} |
| pg_dump / pg_restore / psql | ${meta.environment.pgDumpVersion} |
| Prisma | ${meta.environment.prismaVersion} |
| Node.js | ${meta.environment.nodeVersion} |
| npm | ${meta.environment.npmVersion} |

**Connection strategy:** ${meta.environment.connectionMode}

## Columns (${merged.columnCount})

${merged.columns.map((x: string) => `\`${x}\``).join(", ")}

Column parity: DB-only columns **${columns.columnParity.missingInModel.length}**, model-only columns **${columns.columnParity.extraInModel.length}**.

## Record counts

| Metric | Value |
|---|---|
| Total DB rows | ${c.total} |
| Approved (reviewed=t, deleted=f) | ${c.publicApproved} |
| Pending (reviewed=f, deleted=f) | ${c.pending} |
| Deleted (deleted=t) | ${c.deleted} |
| Reviewed AND deleted | ${c.reviewedAndDeleted} |
| Raw JSON rows | ${c.rawJsonRows} |
| Raw JSONL rows | ${c.rawJsonlRows} |
| Per-item files | ${c.perItemFiles} |
| Manifest items | ${c.manifestItems} |
| Checksum items | ${c.checksumItems} |

## Parity results

\`\`\`
Database rows:          ${c.sourceRows}
Raw JSON rows:          ${c.rawJsonRows}
JSONL rows:             ${c.rawJsonlRows}
Per-item files:         ${c.perItemFiles}
Manifest items:         ${c.manifestItems}

Approved:               ${c.publicApproved}
Pending:                ${c.pending}
Deleted:                ${c.deleted}
Reviewed and deleted:   ${c.reviewedAndDeleted}

Duplicate IDs:          ${validation.identity.duplicateIds}
Missing records:        ${validation.identity.missingRecords}
Unexpected records:     ${validation.identity.unexpectedRecords}
Field mismatches:       ${p.fieldMismatches}
Column mismatches:      ${p.columnMismatches}
HTML hash mismatches:   ${p.htmlHashMismatches}
CSS hash mismatches:    ${p.cssHashMismatches}
JS hash mismatches:     ${p.jsHashMismatches}
Record hash mismatches: ${p.recordHashMismatches}

Backup archive check:   ${meta.restore.pgRestoreList}
Element restore test:   ${meta.restore.result}
Export validation:      ${validation.pass ? "PASS" : "FAIL"}
Secret scan:            ${meta.secretScan.result}
\`\`\`

## Slug report (no changes applied)

- Null slugs: **${s.nullSlugs}**
- Empty slugs: **${s.emptySlugs}**
- Duplicate slugs: **${s.duplicateSlugCount}**
- Invalid-looking slugs: **${s.invalidLookingSlugCount}**

## Consistency (snapshot)

- Method: ${meta.consistency.method}
- Before: n=${meta.consistency.before.n}, maxUpdatedAt=${meta.consistency.before.maxUpdatedAt}, idHash=${meta.consistency.before.idHash}
- After:  n=${meta.consistency.after.n}, maxUpdatedAt=${meta.consistency.after.maxUpdatedAt}, idHash=${meta.consistency.after.idHash}
- Result: **${meta.consistency.result}**

## Backups (stored OUTSIDE git)

Database dumps are kept in a secure directory outside the repository and are **not** committed.

| File | Format | Bytes | SHA-256 |
|---|---|---|---|
${meta.backups.artifacts.map((a: { filename: string; format: string; bytes: number; sha256: string }) => `| \`${a.filename}\` | ${a.format} | ${a.bytes} | \`${a.sha256}\` |`).join("\n")}

- Supabase CLI dump: ${meta.backups.supabaseCliDump}

## Restore verification

- \`pg_restore --list\`: ${meta.restore.pgRestoreList}
- Restore target: ${meta.restore.target}
- Restore type: ${meta.restore.type}
- Restored Element fingerprint: n=${meta.restore.restoredElementFingerprint.n}, approved=${meta.restore.restoredElementFingerprint.approved}, pending=${meta.restore.restoredElementFingerprint.pending}, deleted=${meta.restore.restoredElementFingerprint.deleted}, idHash=${meta.restore.restoredElementFingerprint.idHash}
- Result: **${meta.restore.result}** — ${meta.restore.note}

## Secret / public-repository scan

- Tool: ${meta.secretScan.tool}
- Files scanned: ${meta.secretScan.filesScanned}
- High-confidence findings: **${meta.secretScan.highConfidence}**
- Heuristic findings: **${meta.secretScan.heuristic}**
- Self-test: ${meta.secretScan.selfTest}
- Result: **${meta.secretScan.result}**

## Tests / checks

- Content unit tests (vitest): ${meta.tests.vitestContent}
- Full test suite: ${meta.tests.fullSuite}
- Typecheck: ${meta.tests.typecheck}
- Lint: ${meta.tests.lint}
- Build: ${meta.tests.build}

## Limitations & notes

${(meta.limitations ?? []).map((l: string) => `- ${l}`).join("\n")}
`;

const docsPath = join(repoRoot, "docs", "migrations", "explorer-db-export-report.md");
mkdirSync(dirname(docsPath), { recursive: true });
writeFileSync(docsPath, md, "utf8");

console.log(`Final result: ${merged.finalResult}`);
console.log(`Wrote: content/explorer/export-report.json`);
console.log(`Wrote: docs/migrations/explorer-db-export-report.md`);
if (merged.finalResult !== "PASS") process.exit(1);
