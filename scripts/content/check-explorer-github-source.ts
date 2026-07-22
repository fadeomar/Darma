import path from "node:path";

import { loadEnvFileQuietly } from "./lib/source";
import {
  FetchGitHubExplorerClient,
  getGitHubExplorerConfigFromEnv,
} from "../../src/features/elements/infra/github/githubExplorer.client";
import {
  assertManifestCatalogParity,
  EXPLORER_CATALOG_PATH,
  EXPLORER_MANIFEST_PATH,
  parseExplorerCatalog,
  parseExplorerManifest,
} from "../../src/features/elements/infra/json/elementJson.content";

async function main() {
  if (process.env.ENV_FILE) {
    loadEnvFileQuietly(path.resolve(process.env.ENV_FILE));
  }

  const client = new FetchGitHubExplorerClient(getGitHubExplorerConfigFromEnv());
  const headSha = await client.getHeadSha();
  const [manifestSource, catalogSource] = await Promise.all([
    client.readTextFile(EXPLORER_MANIFEST_PATH, headSha),
    client.readTextFile(EXPLORER_CATALOG_PATH, headSha),
  ]);
  const manifest = parseExplorerManifest(manifestSource);
  const elements = parseExplorerCatalog(catalogSource);
  assertManifestCatalogParity(manifest, elements);

  console.log("Explorer GitHub source check: PASS");
  console.log(`Branch head: ${headSha.slice(0, 12)}`);
  console.log(`Items: ${elements.length}`);
  console.log(`Public approved: ${manifest.counts.publicApproved}`);
  console.log(`Pending: ${manifest.counts.pending}`);
  console.log(`Deleted: ${manifest.counts.deleted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
