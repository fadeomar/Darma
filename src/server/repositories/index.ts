// src/server/repositories/index.ts

import type { ElementRepository } from "@/features/elements/domain/element.repository";
import { ElementPrismaRepository } from "@/features/elements/infra/prisma/elementPrisma.repository";

export type Repositories = {
  element: ElementRepository;
};

// Singleton composition root (server-only)
let repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (repos) return repos;

  repos = {
    element: new ElementPrismaRepository(),
  };

  return repos;
}
