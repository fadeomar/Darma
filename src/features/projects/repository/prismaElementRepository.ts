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

    return row; // or map to Domain if you already have a mapper
  }

  async create(tx: Tx, input: ElementCreateInput) {
    return tx.element.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        url: input.url ?? null,
        tags: input.tags ?? [],
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
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.reviewed !== undefined && { reviewed: input.reviewed }),
      },
    });
  }

  async softDelete(tx: Tx, id: string) {
    return tx.element.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
