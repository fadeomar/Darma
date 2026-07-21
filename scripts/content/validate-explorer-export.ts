/**
 * validate-explorer-export.ts
 *
 * Proves the committed per-item JSON is a lossless copy of the source rows.
 * Compares against the live database by default, or a captured raw JSONL with
 * `--from-raw`. Exits non-zero on ANY mismatch.
 *
 * Usage:
 *   ENV_FILE=../darma/.env.local tsx scripts/content/validate-explorer-export.ts --from-db --raw-dir <dir>
 *   tsx scripts/content/validate-explorer-export.ts --from-raw <path.jsonl>
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { COLUMN_ORDER, orderRecord, type ElementRecord } from "./lib/element-schema";
import { deepEqual, recordHash, valueHash } from "./lib/canonical";
import { getRowsFromDb, getRowsFromRawJsonl, loadEnvFileQuietly } from "./lib/source";

type Args = { fromRaw?: string; rawDir?: string; contentDir: string; reportOut: string };

function parseArgs(argv: string[]): Args {
  const repoRoot = process.cwd();
  const contentDir = join(repoRoot, "content", "explorer");
  const args: Args = { contentDir, reportOut: join(contentDir, "export-report.json") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from-raw") args.fromRaw = resolve(argv[++i]);
    else if (a === "--from-db") args.fromRaw = undefined;
    else if (a === "--raw-dir") args.rawDir = resolve(argv[++i]);
    else if (a === "--content-dir") args.contentDir = resolve(argv[++i]);
    else if (a === "--report-out") args.reportOut = resolve(argv[++i]);
  }
  return args;
}

function looksLikeValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envFile = process.env.ENV_FILE;
  if (envFile) loadEnvFileQuietly(resolve(envFile));

  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  // 1. Source rows.
  let source: ElementRecord[];
  let sourceLabel: string;
  if (args.fromRaw) {
    source = getRowsFromRawJsonl(args.fromRaw).map(orderRecord);
    sourceLabel = `raw:${args.fromRaw}`;
  } else {
    source = (await getRowsFromDb()).map(orderRecord);
    sourceLabel = "database";
  }
  const sourceById = new Map<string, ElementRecord>();
  for (const r of source) sourceById.set(String(r.id), r);

  // 2. Committed artifacts.
  const itemsDir = join(args.contentDir, "items");
  const itemFiles = existsSync(itemsDir)
    ? readdirSync(itemsDir).filter((f) => f.endsWith(".json"))
    : [];
  const manifest = JSON.parse(readFileSync(join(args.contentDir, "manifest.json"), "utf8"));
  const checksums = JSON.parse(readFileSync(join(args.contentDir, "export-checksums.json"), "utf8"));
  const checksumById = new Map<string, Record<string, string>>();
  for (const c of checksums.items) checksumById.set(String(c.id), c);

  // ---- Count parity ----
  const perItemCount = itemFiles.length;
  const manifestTotal = Number(manifest.total);
  const checksumCount = checksums.items.length;
  const counts: Record<string, number | null> = {
    sourceRows: source.length,
    perItemFiles: perItemCount,
    manifestTotal,
    manifestItems: manifest.items.length,
    checksumItems: checksumCount,
    rawJsonlRows: null,
    rawJsonRows: null,
  };
  if (args.rawDir) {
    const jl = join(args.rawDir, "elements.raw.jsonl");
    const jj = join(args.rawDir, "elements.raw.json");
    if (existsSync(jl)) counts.rawJsonlRows = readFileSync(jl, "utf8").split(/\r?\n/).filter((l) => l.trim()).length;
    if (existsSync(jj)) counts.rawJsonRows = (JSON.parse(readFileSync(jj, "utf8")) as unknown[]).length;
  } else {
    warnings.push("Raw JSON/JSONL counts skipped (no --raw-dir provided; raw files live outside git).");
  }
  const countSet = [counts.sourceRows, counts.perItemFiles, counts.manifestTotal, counts.manifestItems, counts.checksumItems]
    .concat(counts.rawJsonlRows === null ? [] : [counts.rawJsonlRows])
    .concat(counts.rawJsonRows === null ? [] : [counts.rawJsonRows]);
  if (new Set(countSet).size !== 1) err(`Count parity failed: ${JSON.stringify(counts)}`);

  // ---- Identity parity ----
  const fileIds = itemFiles.map((f) => f.replace(/\.json$/, ""));
  const fileIdSet = new Set(fileIds);
  if (fileIdSet.size !== fileIds.length) err("Duplicate per-item filenames (duplicate ids).");
  const dbIdSet = new Set(sourceById.keys());
  const missing = [...dbIdSet].filter((id) => !fileIdSet.has(id));
  const unexpected = [...fileIdSet].filter((id) => !dbIdSet.has(id));
  if (missing.length) err(`Missing files for ${missing.length} id(s): ${missing.slice(0, 5).join(", ")}`);
  if (unexpected.length) err(`Unexpected files for ${unexpected.length} id(s): ${unexpected.slice(0, 5).join(", ")}`);

  // ---- Status parity ----
  const statusOf = (rows: ElementRecord[]) => {
    let approved = 0, pending = 0, deleted = 0, revDel = 0;
    for (const r of rows) {
      const rev = r.reviewed === true, del = r.deleted === true;
      if (del) deleted++;
      if (rev && !del) approved++;
      if (!rev && !del) pending++;
      if (rev && del) revDel++;
    }
    return { approved, pending, deleted, revDel };
  };
  const srcStatus = statusOf(source);
  const manStatus = {
    approved: manifest.counts.publicApproved,
    pending: manifest.counts.pending,
    deleted: manifest.counts.deleted,
    revDel: manifest.counts.reviewedAndDeleted,
  };
  if (JSON.stringify(srcStatus) !== JSON.stringify(manStatus)) {
    err(`Status parity failed: source=${JSON.stringify(srcStatus)} manifest=${JSON.stringify(manStatus)}`);
  }

  // ---- Field + column + code parity (per record) ----
  let fieldMismatches = 0;
  let columnMismatches = 0;
  let htmlMismatch = 0, cssMismatch = 0, jsMismatch = 0, recordMismatch = 0;
  const expectedKeys = new Set<string>(["schemaVersion", ...COLUMN_ORDER]);

  for (const [id, srcRec] of sourceById) {
    const file = join(itemsDir, `${id}.json`);
    if (!existsSync(file)) continue; // already reported as missing
    const parsed = JSON.parse(readFileSync(file, "utf8")) as ElementRecord;

    // Column parity: exactly schemaVersion + all DB columns, nothing else.
    const keys = Object.keys(parsed);
    for (const k of keys) if (!expectedKeys.has(k)) { columnMismatches++; err(`Unexpected field '${k}' in ${id}.json`); }
    for (const k of COLUMN_ORDER) if (!(k in parsed)) { columnMismatches++; err(`Missing column '${k}' in ${id}.json`); }
    if (parsed.schemaVersion === undefined) { columnMismatches++; err(`Missing schemaVersion in ${id}.json`); }

    // Field parity: deep equality of all DB columns (schemaVersion removed).
    const fileData: ElementRecord = { ...parsed };
    delete (fileData as Record<string, unknown>).schemaVersion;
    if (!deepEqual(orderRecord(fileData), srcRec)) { fieldMismatches++; if (fieldMismatches <= 5) err(`Field parity mismatch for id ${id}`); }

    // Code parity vs committed checksums AND recomputed from source.
    const cs = checksumById.get(id);
    if (!cs) { err(`No checksum entry for id ${id}`); continue; }
    if (cs.html !== valueHash(srcRec.html ?? null)) { htmlMismatch++; err(`HTML hash mismatch id ${id}`); }
    if (cs.css !== valueHash(srcRec.css ?? null)) { cssMismatch++; err(`CSS hash mismatch id ${id}`); }
    if (cs.js !== valueHash(srcRec.js ?? null)) { jsMismatch++; err(`JS hash mismatch id ${id}`); }
    if (cs.record !== recordHash(srcRec)) { recordMismatch++; err(`Record hash mismatch id ${id}`); }
  }

  // ---- Slug report (report only; never mutate) ----
  const slugCounts = new Map<string, number>();
  let nullSlugs = 0, emptySlugs = 0;
  const invalidSlugs: string[] = [];
  for (const r of source) {
    const s = r.slug;
    if (s === null || s === undefined) { nullSlugs++; continue; }
    const str = String(s);
    if (str === "") { emptySlugs++; continue; }
    slugCounts.set(str, (slugCounts.get(str) ?? 0) + 1);
    if (!looksLikeValidSlug(str)) invalidSlugs.push(str);
  }
  const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1).map(([s]) => s);

  const report = {
    schemaVersion: 1,
    validatedAt: new Date().toISOString(),
    source: sourceLabel.startsWith("raw:") ? "raw-jsonl" : "database",
    table: manifest.table,
    counts,
    identity: {
      duplicateIds: fileIds.length - fileIdSet.size,
      missingRecords: missing.length,
      unexpectedRecords: unexpected.length,
    },
    status: { source: srcStatus, manifest: manStatus },
    parity: {
      fieldMismatches,
      columnMismatches,
      htmlHashMismatches: htmlMismatch,
      cssHashMismatches: cssMismatch,
      jsHashMismatches: jsMismatch,
      recordHashMismatches: recordMismatch,
    },
    slugs: {
      nullSlugs,
      emptySlugs,
      duplicateSlugs,
      duplicateSlugCount: duplicateSlugs.length,
      invalidLookingSlugs: invalidSlugs.slice(0, 50),
      invalidLookingSlugCount: invalidSlugs.length,
    },
    warnings,
    errorCount: errors.length,
    pass: errors.length === 0,
  };
  writeFileSync(args.reportOut, JSON.stringify(report, null, 2) + "\n", "utf8");

  // ---- Human-readable summary ----
  console.log("Explorer export validation");
  console.log(`  source            : ${report.source} (${manifest.table})`);
  console.log(`  counts            : ${JSON.stringify(counts)}`);
  console.log(`  duplicate ids     : ${report.identity.duplicateIds}`);
  console.log(`  missing records   : ${report.identity.missingRecords}`);
  console.log(`  unexpected records: ${report.identity.unexpectedRecords}`);
  console.log(`  field mismatches  : ${fieldMismatches}`);
  console.log(`  column mismatches : ${columnMismatches}`);
  console.log(`  html/css/js hash  : ${htmlMismatch}/${cssMismatch}/${jsMismatch}`);
  console.log(`  record hash       : ${recordMismatch}`);
  console.log(`  slugs null/empty/dup/invalid: ${nullSlugs}/${emptySlugs}/${duplicateSlugs.length}/${invalidSlugs.length}`);
  for (const w of warnings) console.log(`  WARN: ${w}`);
  if (errors.length) {
    console.error(`\nVALIDATION FAILED with ${errors.length} error(s):`);
    for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("\nVALIDATION PASS");
}

main().catch((e) => {
  console.error("validation crashed:", e?.message ?? e);
  process.exit(1);
});
