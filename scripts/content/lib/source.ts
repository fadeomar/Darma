import { readFileSync } from "node:fs";
import { COLUMN_ORDER, SOURCE_TABLE, type ElementRecord } from "./element-schema";

/**
 * Load environment variables from a dotenv-style file WITHOUT ever printing a
 * value. Used to pull DATABASE_URL from the app's .env.local, which Prisma does
 * not read automatically. Existing process.env values are not overwritten.
 */
export function loadEnvFileQuietly(path: string): string[] {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  const loaded: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
      loaded.push(key); // key name only — never the value
    }
  }
  return loaded;
}

export type ColumnMeta = {
  ordinal_position: number;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
};

/**
 * Read all Element rows from the database using the server's own `row_to_json`
 * serialization (the same representation captured in the raw backup), ordered
 * deterministically by (createdAt, id). Returns plain JS objects.
 */
export async function getRowsFromDb(): Promise<ElementRecord[]> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const sql =
      `SELECT row_to_json(t) AS r FROM (SELECT * FROM ${SOURCE_TABLE} ORDER BY "createdAt", "id") t`;
    const rows = (await prisma.$queryRawUnsafe(sql)) as Array<{ r: ElementRecord }>;
    return rows.map((row) => row.r);
  } finally {
    await prisma.$disconnect();
  }
}

export async function getColumnsFromDb(): Promise<ColumnMeta[]> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const sql = `
      SELECT ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Element'
      ORDER BY ordinal_position`;
    const rows = (await prisma.$queryRawUnsafe(sql)) as Array<Record<string, unknown>>;
    return rows.map((c) => ({
      ordinal_position: Number(c.ordinal_position),
      column_name: String(c.column_name),
      data_type: String(c.data_type),
      udt_name: String(c.udt_name),
      is_nullable: String(c.is_nullable),
      column_default: c.column_default === null ? null : String(c.column_default),
    }));
  } finally {
    await prisma.$disconnect();
  }
}

/** Read rows from a captured JSONL raw export (one JSON object per line). */
export function getRowsFromRawJsonl(path: string): ElementRecord[] {
  const raw = readFileSync(path, "utf8");
  const out: ElementRecord[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    out.push(JSON.parse(line) as ElementRecord);
  }
  return out;
}

/** Column-set parity between the live/exported columns and the known model. */
export function diffColumns(dbColumns: string[]): {
  missingInModel: string[];
  extraInModel: string[];
} {
  const known = new Set<string>(COLUMN_ORDER as readonly string[]);
  const db = new Set(dbColumns);
  return {
    missingInModel: [...db].filter((c) => !known.has(c)).sort(),
    extraInModel: [...known].filter((c) => !db.has(c)).sort(),
  };
}
