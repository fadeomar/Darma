import path from "node:path";

import { prisma } from "../../src/server/db/prisma";
import type { AdminElementStatus } from "../../src/features/elements/domain/admin/elementAdmin.repository";
import type { Element } from "../../src/features/elements/domain/element";
import { toElementDTO } from "../../src/features/elements/dto/element.dto.mapper";
import { ElementGitHubRepository } from "../../src/features/elements/infra/github/elementGitHub.repository";
import {
  FetchGitHubExplorerClient,
  getGitHubExplorerConfigFromEnv,
} from "../../src/features/elements/infra/github/githubExplorer.client";
import { ElementPrismaAdminRepository } from "../../src/features/elements/infra/prisma/elementPrismaAdmin.repository";
import { loadEnvFileQuietly } from "./lib/source";

const STATUSES: AdminElementStatus[] = [
  "all",
  "pending",
  "deleted",
  "approved",
  "needSlug",
  "active",
  "reviewQueue",
];

function canonical(value: unknown): string {
  return JSON.stringify(value);
}

function words(value: string | null | undefined): string[] {
  return (value || "")
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}_-]/gu, ""))
    .filter((word) => word.length >= 4);
}

function deriveQuerySamples(elements: readonly Element[]): string[] {
  const samples = new Set<string>();
  for (const element of elements) {
    const candidates = [
      ...words(element.title),
      ...words(element.description).slice(0, 1),
      ...words(element.shortDescription).slice(0, 1),
      ...element.tags.slice(0, 1),
    ];
    for (const candidate of candidates) {
      samples.add(candidate);
      if (samples.size >= 12) return [...samples];
    }
  }
  return [...samples];
}

async function main() {
  if (process.env.ENV_FILE) {
    loadEnvFileQuietly(path.resolve(process.env.ENV_FILE));
  }

  const database = new ElementPrismaAdminRepository(prisma);
  const github = new ElementGitHubRepository(
    new FetchGitHubExplorerClient(getGitHubExplorerConfigFromEnv()),
  );

  const [databaseAll, githubAll, databaseSummary, githubSummary] =
    await Promise.all([
      database.list({ status: "all", page: 1, pageSize: 10_000 }),
      github.list({ status: "all", page: 1, pageSize: 10_000 }),
      database.getDashboardSummary(),
      github.getDashboardSummary(),
    ]);

  const databaseById = new Map(
    databaseAll.items.map((element) => [element.id, toElementDTO(element)]),
  );
  const githubById = new Map(
    githubAll.items.map((element) => [element.id, toElementDTO(element)]),
  );
  const allIds = new Set([...databaseById.keys(), ...githubById.keys()]);
  let idMismatches = 0;
  let fieldMismatches = 0;

  for (const id of allIds) {
    const databaseItem = databaseById.get(id);
    const githubItem = githubById.get(id);
    if (!databaseItem || !githubItem) {
      idMismatches += 1;
      continue;
    }
    if (canonical(databaseItem) !== canonical(githubItem)) fieldMismatches += 1;
  }

  let statusMismatches = 0;
  for (const status of STATUSES) {
    const [databaseList, githubList] = await Promise.all([
      database.list({ status, page: 1, pageSize: 10_000 }),
      github.list({ status, page: 1, pageSize: 10_000 }),
    ]);
    if (
      canonical(databaseList.items.map((element) => element.id)) !==
      canonical(githubList.items.map((element) => element.id))
    ) {
      statusMismatches += 1;
    }
  }

  const querySamples = deriveQuerySamples(databaseAll.items);
  let queryMismatches = 0;
  for (const query of querySamples) {
    const [databaseList, githubList] = await Promise.all([
      database.list({ query, status: "all", page: 1, pageSize: 10_000 }),
      github.list({ query, status: "all", page: 1, pageSize: 10_000 }),
    ]);
    if (
      canonical(databaseList.items.map((element) => element.id)) !==
      canonical(githubList.items.map((element) => element.id))
    ) {
      queryMismatches += 1;
    }
  }

  const summaryFields = [
    "total",
    "published",
    "pending",
    "deleted",
    "missingCategory",
    "missingShortDescription",
    "missingTags",
  ] as const;
  const summaryMismatches = summaryFields.filter(
    (field) => databaseSummary[field] !== githubSummary[field],
  ).length;
  const recentMismatch =
    canonical(databaseSummary.recent.map((element) => element.id)) !==
    canonical(githubSummary.recent.map((element) => element.id));

  if (
    idMismatches ||
    fieldMismatches ||
    statusMismatches ||
    queryMismatches ||
    summaryMismatches ||
    recentMismatch
  ) {
    throw new Error(
      [
        "Explorer admin-source parity failed",
        `ids=${idMismatches}`,
        `fields=${fieldMismatches}`,
        `statuses=${statusMismatches}`,
        `queries=${queryMismatches}`,
        `summary=${summaryMismatches}`,
        `recent=${recentMismatch ? 1 : 0}`,
      ].join(": "),
    );
  }

  console.log("Explorer admin-source parity: PASS");
  console.log(`Items: ${allIds.size}`);
  console.log(`Status comparisons: ${STATUSES.length} passed`);
  console.log(`Query comparisons: ${querySamples.length} passed`);
  console.log("ID mismatches: 0");
  console.log("Field mismatches: 0");
  console.log("Summary mismatches: 0");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
