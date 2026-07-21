import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Element } from "../../domain/element";
import { toElementDomainFromJson } from "./elementJson.mapper";

const EXPLORER_ROOT = path.resolve(process.cwd(), "content/explorer");
const MANIFEST_PATH = path.join(EXPLORER_ROOT, "manifest.json");

type ExplorerManifestItem = {
  filename: string;
};

type ExplorerManifest = {
  total: number;
  items: ExplorerManifestItem[];
};

function parseManifest(value: unknown): ExplorerManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Explorer manifest must be a JSON object");
  }

  const manifest = value as Record<string, unknown>;
  if (!Number.isInteger(manifest.total) || (manifest.total as number) < 0) {
    throw new Error("Explorer manifest has an invalid total");
  }
  if (!Array.isArray(manifest.items)) {
    throw new Error("Explorer manifest has an invalid items list");
  }

  const items = manifest.items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Explorer manifest item ${index} is invalid`);
    }
    const filename = (item as Record<string, unknown>).filename;
    if (typeof filename !== "string" || filename.length === 0) {
      throw new Error(`Explorer manifest item ${index} has no filename`);
    }
    return { filename };
  });

  return { total: manifest.total as number, items };
}

async function readManifest(): Promise<ExplorerManifest> {
  try {
    const source = await readFile(MANIFEST_PATH, "utf8");
    return parseManifest(JSON.parse(source));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Explorer manifest "manifest.json": ${message}`);
  }
}

async function readElement(filename: string): Promise<Element> {
  const filePath = path.resolve(EXPLORER_ROOT, filename);

  if (
    filePath !== EXPLORER_ROOT &&
    !filePath.startsWith(`${EXPLORER_ROOT}${path.sep}`)
  ) {
    throw new Error(`Explorer record filename escapes content root: ${filename}`);
  }

  try {
    const source = await readFile(filePath, "utf8");
    return toElementDomainFromJson(JSON.parse(source), filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Explorer record "${filename}": ${message}`);
  }
}

async function loadExplorerElementsUncached(): Promise<Element[]> {
  const manifest = await readManifest();

  if (manifest.items.length !== manifest.total) {
    throw new Error(
      `Explorer manifest total mismatch: expected ${manifest.total}, listed ${manifest.items.length}`,
    );
  }

  const elements = await Promise.all(
    manifest.items.map(({ filename }) => readElement(filename)),
  );

  if (elements.length !== manifest.total) {
    throw new Error(
      `Explorer loaded item count mismatch: expected ${manifest.total}, loaded ${elements.length}`,
    );
  }

  return elements;
}

let explorerElementsPromise: Promise<Element[]> | null = null;

export function loadExplorerElements(): Promise<Element[]> {
  explorerElementsPromise ??= loadExplorerElementsUncached();
  return explorerElementsPromise;
}
