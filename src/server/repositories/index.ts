// src/server/repositories/index.ts

import type { ElementAdminRepository } from "@/features/elements/domain/admin/elementAdmin.repository";
import {
  parseExplorerAdminContentSource,
  parseExplorerPublicContentSource,
  type ExplorerAdminContentSource,
} from "@/features/elements/config/explorerContentSource";
import type { ElementRepository } from "@/features/elements/domain/element.repository";
import { ElementGitHubRepository } from "@/features/elements/infra/github/elementGitHub.repository";
import {
  FetchGitHubExplorerClient,
  getGitHubExplorerConfigFromEnv,
} from "@/features/elements/infra/github/githubExplorer.client";
import { ElementJsonRepository } from "@/features/elements/infra/json/elementJson.repository";
import { ElementPrismaAdminRepository } from "@/features/elements/infra/prisma/elementPrismaAdmin.repository";
import { ElementPrismaRepository } from "@/features/elements/infra/prisma/elementPrisma.repository";
import { prisma } from "@/server/db/prisma";


export type Repositories = {
  element: ElementRepository;
  adminElement: ElementAdminRepository;
};

function createElementRepository(): ElementRepository {
  const source = parseExplorerPublicContentSource(
    process.env.EXPLORER_CONTENT_SOURCE,
  );
  return source === "json"
    ? new ElementJsonRepository()
    : new ElementPrismaRepository();
}

export function getExplorerAdminContentSource(): ExplorerAdminContentSource {
  return parseExplorerAdminContentSource(
    process.env.EXPLORER_ADMIN_CONTENT_SOURCE,
  );
}

export function createAdminElementRepository(
  source: ExplorerAdminContentSource = getExplorerAdminContentSource(),
): ElementAdminRepository {
  switch (source) {
    case "database":
      return new ElementPrismaAdminRepository(prisma);
    case "github":
      return new ElementGitHubRepository(
        new FetchGitHubExplorerClient(getGitHubExplorerConfigFromEnv()),
      );
  }
}

let repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (repos) return repos;

  repos = {
    element: createElementRepository(),
    adminElement: createAdminElementRepository(),
  };

  return repos;
}
