import { readFile } from "node:fs/promises";
import path from "node:path";

import { recordHash } from "./lib/canonical";
import type { ElementRecord } from "./lib/element-schema";
import { toElementDomainFromJson } from "../../src/features/elements/infra/json/elementJson.mapper";
import {
  assertManifestCatalogParity,
  parseExplorerCatalog,
  parseExplorerManifest,
} from "../../src/features/elements/infra/json/elementJson.content";

async function main() {
  const root = path.resolve(process.cwd(), "content/explorer");
  const manifest = parseExplorerManifest(
    await readFile(path.join(root, "manifest.json"), "utf8"),
  );
  const catalog = parseExplorerCatalog(
    await readFile(path.join(root, "catalog.json"), "utf8"),
  );
  assertManifestCatalogParity(manifest, catalog);

  let checksumMismatches = 0;
  let fieldMismatches = 0;
  for (let index = 0; index < manifest.items.length; index += 1) {
    const entry = manifest.items[index];
    const source = await readFile(path.join(root, entry.filename), "utf8");
    const record = JSON.parse(source) as ElementRecord;
    const item = toElementDomainFromJson(record, entry.filename);
    const catalogItem = catalog[index];

    if (JSON.stringify(item) !== JSON.stringify(catalogItem)) fieldMismatches += 1;
    if (recordHash(record) !== entry.checksum) checksumMismatches += 1;
  }

  if (fieldMismatches || checksumMismatches) {
    throw new Error(
      `Explorer catalog validation failed: field mismatches=${fieldMismatches}, checksum mismatches=${checksumMismatches}`,
    );
  }

  console.log("Explorer catalog validation: PASS");
  console.log(`Items: ${catalog.length}`);
  console.log("Field mismatches: 0");
  console.log("Checksum mismatches: 0");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
