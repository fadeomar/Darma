// src/features/projects/application/elementWriteService.ts
import type { PrismaClient, Prisma } from "@prisma/client";
import type { ElementRepository } from "../repository/elementRepository";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";
import { slugify } from "@/lib/slug";

export class ElementWriteService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repo: ElementRepository,
  ) {}

  async create(input: ElementCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const base = slugify(input.title || "element");
      const slug = await this.makeUniqueSlug(tx, base);

      // pass the server-generated slug alongside the validated create input
      return this.repo.create(tx, {
        ...input,
        slug,
      });
    });
  }

  async update(id: string, input: ElementUpdateInput) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.repo.getById(tx, id, {
        includeDeleted: true,
      });
      if (!existing) {
        throw new ElementNotFoundError(id);
      }

      // If title is changing, regenerate slug
      // (If you want "slug never changes", remove this block)
      let next = input as Record<string, unknown>;

      if (typeof input.title === "string" && input.title.trim().length > 0) {
        const base = slugify(input.title);
        const slug = await this.makeUniqueSlug(tx, base, id);
        next = { ...input, slug };
      }

      return this.repo.update(tx, id, next as ElementUpdateInput);
    });
  }

  async softDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.repo.getById(tx, id, {
        includeDeleted: true,
      });
      if (!existing) throw new ElementNotFoundError(id);

      if (existing.deleted) return existing;

      return this.repo.softDelete(tx, id);
    });
  }

  async restore(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.repo.getById(tx, id, {
        includeDeleted: true,
      });
      if (!existing) throw new ElementNotFoundError(id);

      if (!existing.deleted) return existing;

      return this.repo.restore(tx, id);
    });
  }

  /**
   * Ensures slug uniqueness at the DB level.
   * - Uses the same transaction `tx` for consistency.
   * - `excludeId` is used on updates to allow keeping current element's slug.
   */
  private async makeUniqueSlug(
    tx: Prisma.TransactionClient,
    base: string,
    excludeId?: string,
  ) {
    const cleanBase = (base || "element").trim();
    let slug = cleanBase;

    for (let i = 0; i < 200; i += 1) {
      const existing = await tx.element.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) return slug;

      slug = `${cleanBase}-${i + 2}`;
    }

    // Super defensive fallback: practically never happens
    return `${cleanBase}-${Date.now()}`;
  }
}

export class ElementNotFoundError extends Error {
  readonly name = "ElementNotFoundError";
  constructor(public readonly id: string) {
    super(`Element not found: ${id}`);
  }
}
