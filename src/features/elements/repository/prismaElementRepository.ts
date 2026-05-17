// src/features/projects/repository/prismaElementRepository.ts
import type {
  ElementRepository,
  Tx,
  GetByIdOptions,
} from "./elementRepository";
import type {
  ElementCreateInput,
  ElementUpdateInput,
} from "../validation/elementWriteSchemas";

export class PrismaElementRepository implements ElementRepository {
  async getById(tx: Tx, id: string, opts?: GetByIdOptions) {
    const includeDeleted = opts?.includeDeleted ?? false;

    const row = await tx.element.findUnique({
      where: { id },
    });

    if (!row) return null;
    if (!includeDeleted && row.deleted) return null;

    return row;
  }

  async create(tx: Tx, input: ElementCreateInput) {
    return tx.element.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description ?? "",
        shortDescription: input.shortDescription ?? null,
        html: input.html ?? "",
        css: input.css ?? "",
        js: input.js ?? "",
        tags: input.tags ?? [],
        mainCategory: input.mainCategory ?? [],
        secondaryCategory: input.secondaryCategory ?? [],
        reviewed: input.reviewed ?? false,
        deleted: false,
      },
    });
  }

  async update(tx: Tx, id: string, input: ElementUpdateInput) {
    return tx.element.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.shortDescription !== undefined && {
          shortDescription: input.shortDescription,
        }),
        ...(input.html !== undefined && { html: input.html }),
        ...(input.css !== undefined && { css: input.css }),
        ...(input.js !== undefined && { js: input.js }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.mainCategory !== undefined && {
          mainCategory: input.mainCategory,
        }),
        ...(input.secondaryCategory !== undefined && {
          secondaryCategory: input.secondaryCategory,
        }),
        ...(input.reviewed !== undefined && { reviewed: input.reviewed }),
      },
    });
  }

  async softDelete(tx: Tx, id: string) {
    return tx.element.update({
      where: { id },
      data: {
        deleted: true,
      },
    });
  }

  async restore(tx: Tx, id: string) {
    return tx.element.update({
      where: { id },
      data: {
        deleted: false,
      },
    });
  }
}
