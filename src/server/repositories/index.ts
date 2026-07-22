// src/server/repositories/index.ts

import type { ElementRepository } from "@/features/elements/domain/element.repository";
import { ElementJsonRepository } from "@/features/elements/infra/json/elementJson.repository";
import { ElementPrismaRepository } from "@/features/elements/infra/prisma/elementPrisma.repository";

export type Repositories = {
  element: ElementRepository;
  adminElement: ElementRepository;
};

function createElementRepository(): ElementRepository {
  const source =
    process.env.EXPLORER_CONTENT_SOURCE?.trim().toLowerCase() || "database";

  switch (source) {
    case "database":
      return new ElementPrismaRepository();
    case "json":
      return new ElementJsonRepository();
    default:
      throw new Error(`Unsupported EXPLORER_CONTENT_SOURCE: ${source}`);
  }
}

// Singleton composition root (server-only)
let repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (repos) return repos;

  repos = {
    element: createElementRepository(),
    adminElement: new ElementPrismaRepository(),
  };

  return repos;
}
