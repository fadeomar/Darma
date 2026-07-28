import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { toElementDomainFromJson } from "../../src/features/elements/infra/json/elementJson.mapper";
import {
  parseExplorerManifest,
  serializeExplorerCatalog,
} from "../../src/features/elements/infra/json/elementJson.content";

async function main() {
  const root = path.resolve(process.cwd(), "content/explorer");
  const manifestSource = await readFile(path.join(root, "manifest.json"), "utf8");
  const manifest = parseExplorerManifest(manifestSource);
  const elements = await Promise.all(
    manifest.items.map(async (item) => {
      const filename = item.filename;
      const source = await readFile(path.join(root, filename), "utf8");
      return toElementDomainFromJson(JSON.parse(source), filename);
    }),
  );

  await writeFile(
    path.join(root, "catalog.json"),
    serializeExplorerCatalog(elements),
    "utf8",
  );
  console.log(`Explorer catalog: wrote ${elements.length} items`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
