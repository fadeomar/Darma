import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { toElementDomainFromJson } from "./elementJson.mapper";
import {
  assertManifestCatalogParity,
  parseExplorerCatalog,
  parseExplorerManifest,
} from "./elementJson.content";

describe("Explorer catalog source", () => {
  it("matches the manifest and every source item", async () => {
    const root = path.resolve(process.cwd(), "content/explorer");
    const manifest = parseExplorerManifest(
      await readFile(path.join(root, "manifest.json"), "utf8"),
    );
    const catalog = parseExplorerCatalog(
      await readFile(path.join(root, "catalog.json"), "utf8"),
    );
    assertManifestCatalogParity(manifest, catalog);

    const sourceItems = await Promise.all(
      manifest.items.map(async (item) =>
        toElementDomainFromJson(
          JSON.parse(await readFile(path.join(root, item.filename), "utf8")),
          item.filename,
        ),
      ),
    );

    expect(catalog).toEqual(sourceItems);
    expect(catalog.every((element) => element.createdAt instanceof Date)).toBe(true);
    expect(catalog.every((element) => element.updatedAt instanceof Date)).toBe(true);
  });
});
