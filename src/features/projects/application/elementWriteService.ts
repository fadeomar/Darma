// src/features/projects/application/elementWriteService.ts
import type { PrismaClient } from "@prisma/client";
import type { ElementRepository } from "../repository/elementRepository";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";

export class ElementWriteService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repo: ElementRepository,
  ) {}

  async create(input: ElementCreateInput) {
    // Transaction-safe boundary (future-proof for multi-write operations)
    return this.prisma.$transaction(async (tx) => {
      return this.repo.create(tx, input);
    });
  }

  async update(id: string, input: ElementUpdateInput) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.repo.getById(tx, id, {
        includeDeleted: true,
      });
      if (!existing) {
        // Let API translate this to 404 (domain/application error)
        throw new ElementNotFoundError(id);
      }
      return this.repo.update(tx, id, input);
    });
  }

  async softDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.repo.getById(tx, id, {
        includeDeleted: true,
      });
      if (!existing) throw new ElementNotFoundError(id);

      // idempotent soft delete is usually desirable
      if (existing.deleted) return existing;

      return this.repo.softDelete(tx, id);
    });
  }
}

export class ElementNotFoundError extends Error {
  readonly name = "ElementNotFoundError";
  constructor(public readonly id: string) {
    super(`Element not found: ${id}`);
  }
}
