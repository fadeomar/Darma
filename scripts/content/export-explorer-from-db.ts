/**
 * export-explorer-from-db.ts
 *
 * Phase-1 lossless export of every Explorer `Element` row to JSON.
 * - Reads rows via the DB (server-side row_to_json) OR from a captured raw JSONL.
 * - Writes one deterministic JSON file per element under content/explorer/items/.
 * - Writes manifest.json, export-checksums.json and element-columns.json.
 * - Writes a raw copy (JSONL + JSON) to a NON-git directory.
 *
 * This script never mutates the database. It performs only SELECTs.
 *
 * Usage:
 *   ENV_FILE=../darma/.env.local tsx scripts/content/export-explorer-from-db.ts --from-db
 *   tsx scripts/content/export-explorer-from-db.ts --from-raw <path-to.jsonl> [--columns <columns.raw.json>]
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  COLUMN_ORDER,
  PRISMA_FIELD_MAP,
  SCHEMA_VERSION,
  SOURCE_TABLE,
  isFilesafeId,
  orderRecord,
  type ElementRecord,
} from "./lib/element-schema";
import { recordHash, serializeItemFile, valueHash } from "./lib/canonical";
import {
  diffColumns,
  getColumnsFromDb,
  getRowsFromDb,
  getRowsFromRawJsonl,
  loadEnvFileQuietly,
  type ColumnMeta,
} from "./lib/source";

type Args = {
  fromRaw?: string;
  columns?: string;
  rawOut: string;
  contentDir: string;
};

function parseArgs(argv: string[]): Args {
  const repoRoot = process.cwd();
  const args: Args = {
    rawOut: join(repoRoot, "migration-backups", "private", "explorer-raw"),
    contentDir: join(repoRoot, "content", "explorer"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from-raw") args.fromRaw = resolve(argv[++i]);
    else if (a === "--from-db") args.fromRaw = undefined;
    else if (a === "--columns") args.columns = resolve(argv[++i]);
    else if (a === "--raw-out") args.rawOut = resolve(argv[++i]);
    else if (a === "--content-dir") args.contentDir = resolve(argv[++i]);
  }
  return args;
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function classify(rows: ElementRecord[]) {
  let publicApproved = 0;
  let pending = 0;
  let deleted = 0;
  let reviewedAndDeleted = 0;
  for (const r of rows) {
    const rev = r.reviewed === true;
    const del = r.deleted === true;
    if (del) deleted++;
    if (rev && !del) publicApproved++;
    if (!rev && !del) pending++;
    if (rev && del) reviewedAndDeleted++;
  }
  return { total: rows.length, publicApproved, pending, deleted, reviewedAndDeleted };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const envFile = process.env.ENV_FILE;
  if (envFile) {
    const keys = loadEnvFileQuietly(resolve(envFile));
    if (keys.length) console.log(`Loaded env keys from ${envFile}: ${keys.join(", ")}`);
  }

  // 1. Load rows.
  let rows: ElementRecord[];
  if (args.fromRaw) {
    console.log(`Source: raw JSONL -> ${args.fromRaw}`);
    rows = getRowsFromRawJsonl(args.fromRaw);
  } else {
    console.log(`Source: database (${SOURCE_TABLE})`);
    rows = await getRowsFromDb();
  }
  console.log(`Loaded ${rows.length} rows.`);

  // 2. Load column metadata (DB preferred; fall back to a captured columns file).
  let columns: ColumnMeta[];
  if (args.columns && existsSync(args.columns)) {
    columns = JSON.parse(readFileSync(args.columns, "utf8")) as ColumnMeta[];
  } else if (!args.fromRaw || process.env.DATABASE_URL) {
    columns = await getColumnsFromDb();
  } else {
    throw new Error("No column metadata available: pass --columns <file> or provide DATABASE_URL.");
  }
  const dbColumnNames = columns.map((c) => c.column_name);
  const colDiff = diffColumns(dbColumnNames);

  // 3. Write raw copy OUTSIDE git (reproducibility / audit).
  ensureDir(args.rawOut);
  const orderedRows = rows.map(orderRecord);
  const rawJsonlPath = join(args.rawOut, "elements.raw.jsonl");
  const rawJsonPath = join(args.rawOut, "elements.raw.json");
  writeFileSync(rawJsonlPath, orderedRows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  writeFileSync(rawJsonPath, JSON.stringify(orderedRows, null, 2) + "\n", "utf8");

  // 4. Prepare content dirs. Wipe only the items dir we own, then rewrite it.
  const itemsDir = join(args.contentDir, "items");
  if (existsSync(itemsDir)) rmSync(itemsDir, { recursive: true, force: true });
  ensureDir(itemsDir);

  // 5. element-columns.json (committed): DB column meta + Prisma mapping.
  const elementColumns = {
    schemaVersion: SCHEMA_VERSION,
    table: SOURCE_TABLE,
    columns: columns.map((c) => ({
      ...c,
      prismaField: PRISMA_FIELD_MAP[c.column_name] ?? null,
    })),
    columnParity: colDiff,
  };
  writeFileSync(
    join(args.contentDir, "element-columns.json"),
    JSON.stringify(elementColumns, null, 2) + "\n",
    "utf8",
  );

  // 6. Per-item files + manifest + checksums.
  const manifestItems: Array<Record<string, unknown>> = [];
  const checksums: Array<Record<string, unknown>> = [];
  const badIds: string[] = [];
  const seenIds = new Set<string>();

  for (const record of orderedRows) {
    const id = String(record.id);
    if (!isFilesafeId(id)) badIds.push(id);
    if (seenIds.has(id)) {
      throw new Error(`Duplicate id encountered during export: ${id}`);
    }
    seenIds.add(id);

    const filename = `${id}.json`;
    writeFileSync(join(itemsDir, filename), serializeItemFile(record), "utf8");

    manifestItems.push({
      id,
      slug: record.slug ?? null,
      filename: `items/${filename}`,
      reviewed: record.reviewed === true,
      deleted: record.deleted === true,
      createdAt: record.createdAt ?? null,
      updatedAt: record.updatedAt ?? null,
      title: typeof record.title === "string" ? record.title : null,
      checksum: recordHash(record),
    });

    checksums.push({
      id,
      record: recordHash(record),
      html: valueHash(record.html ?? null),
      css: valueHash(record.css ?? null),
      js: valueHash(record.js ?? null),
      description: valueHash(record.description ?? null),
    });
  }

  if (badIds.length) {
    throw new Error(`Refusing to write: ${badIds.length} id(s) are not filesystem-safe: ${badIds.slice(0, 5).join(", ")}`);
  }

  const counts = classify(orderedRows);

  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: "neon-postgresql",
    table: SOURCE_TABLE,
    total: counts.total,
    counts: {
      publicApproved: counts.publicApproved,
      pending: counts.pending,
      deleted: counts.deleted,
      reviewedAndDeleted: counts.reviewedAndDeleted,
    },
    items: manifestItems,
  };
  writeFileSync(join(args.contentDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  writeFileSync(
    join(args.contentDir, "export-checksums.json"),
    JSON.stringify({ schemaVersion: SCHEMA_VERSION, items: checksums }, null, 2) + "\n",
    "utf8",
  );

  console.log("Export complete:");
  console.log(`  per-item files : ${manifestItems.length}`);
  console.log(`  approved       : ${counts.publicApproved}`);
  console.log(`  pending        : ${counts.pending}`);
  console.log(`  deleted        : ${counts.deleted}`);
  console.log(`  reviewed+deleted: ${counts.reviewedAndDeleted}`);
  console.log(`  columns        : ${columns.length} (db-only: ${colDiff.missingInModel.length}, model-only: ${colDiff.extraInModel.length})`);
  console.log(`  raw copy       : ${rawJsonlPath}`);
}

main().catch((err) => {
  console.error("export failed:", err?.message ?? err);
  process.exit(1);
});
