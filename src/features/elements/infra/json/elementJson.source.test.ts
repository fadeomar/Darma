import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildElementSearchSpec } from "../../domain/search/elementSearch.spec";
import { loadExplorerElements } from "./elementJson.loader";
import { ElementJsonRepository } from "./elementJson.repository";

type Manifest = {
  total: number;
  items: Array<{ filename: string }>;
};

describe("Explorer JSON source smoke test", () => {
  it("loads the manifest total and derives the public count from source records", async () => {
    const explorerRoot = path.resolve(process.cwd(), "content/explorer");
    const manifest = JSON.parse(
      await readFile(path.join(explorerRoot, "manifest.json"), "utf8"),
    ) as Manifest;
    const sourceRecords = await Promise.all(
      manifest.items.map(async ({ filename }) =>
        JSON.parse(await readFile(path.join(explorerRoot, filename), "utf8")),
      ),
    );
    const expectedPublicCount = sourceRecords.filter(
      (record) => record.reviewed === true && record.deleted === false,
    ).length;

    const loadedElements = await loadExplorerElements();
    const repository = new ElementJsonRepository();
    const allResult = await repository.search(
      buildElementSearchSpec({
        pagination: { page: 1, pageSize: 100 },
        visibility: { mode: "admin", includeDeleted: true, reviewed: "all" },
      }),
    );
    const publicResult = await repository.search(
      buildElementSearchSpec({
        pagination: { page: 1, pageSize: 100 },
        visibility: { mode: "public" },
      }),
    );

    expect(manifest.items).toHaveLength(manifest.total);
    expect(loadedElements).toHaveLength(manifest.total);
    expect(allResult.total).toBe(manifest.total);
    expect(publicResult.total).toBe(expectedPublicCount);
    expect(
      loadedElements.every(
        (element) =>
          element.createdAt instanceof Date && element.updatedAt instanceof Date,
      ),
    ).toBe(true);
  });
});
