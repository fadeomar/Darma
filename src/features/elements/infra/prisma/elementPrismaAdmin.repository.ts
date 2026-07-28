import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  AdminDashboardSummary,
  AdminElementListInput,
  AdminElementListResult,
  ElementAdminRepository,
  ElementAdminUpdate,
} from "../../domain/admin/elementAdmin.repository";
import type { Element } from "../../domain/element";
import { toElementDomain } from "./elementPrisma.mapper";

function statusWhere(status: AdminElementListInput["status"]): Prisma.ElementWhereInput {
  switch (status) {
    case "pending":
      return { reviewed: false, deleted: false };
    case "deleted":
      return { deleted: true };
    case "approved":
      return { reviewed: true, deleted: false };
    case "needSlug":
      return { deleted: false, OR: [{ slug: null }, { slug: "" }] };
    case "active":
      return { deleted: false };
    case "reviewQueue":
      return { OR: [{ reviewed: false, deleted: false }, { deleted: true }] };
    case "all":
    default:
      return {};
  }
}

export class ElementPrismaAdminRepository implements ElementAdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(input: AdminElementListInput): Promise<AdminElementListResult> {
    const query = input.query?.trim() || "";
    const where: Prisma.ElementWhereInput = {
      AND: [
        statusWhere(input.status),
        query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { shortDescription: { contains: query, mode: "insensitive" } },
                { tags: { hasSome: [query] } },
              ],
            }
          : {},
      ],
    };

    const [total, rows] = await Promise.all([
      this.prisma.element.count({ where }),
      this.prisma.element.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      items: rows.map(toElementDomain),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  async getById(id: string): Promise<Element | null> {
    const row = await this.prisma.element.findUnique({ where: { id } });
    return row ? toElementDomain(row) : null;
  }

  async getBySlug(slug: string): Promise<Element | null> {
    const row = await this.prisma.element.findUnique({ where: { slug } });
    return row ? toElementDomain(row) : null;
  }

  async create(element: Element): Promise<Element> {
    const row = await this.prisma.element.create({
      data: {
        slug: element.slug ?? null,
        title: element.title,
        description: element.description ?? "",
        shortDescription: element.shortDescription,
        html: element.html,
        css: element.css,
        js: element.js,
        tags: element.tags,
        mainCategory: element.mainCategory,
        secondaryCategory: element.secondaryCategory,
        reviewed: element.reviewed,
        deleted: element.deleted,
      },
    });
    return toElementDomain(row);
  }

  async update(
    id: string,
    changes: ElementAdminUpdate,
  ): Promise<Element | null> {
    try {
      const row = await this.prisma.element.update({
        where: { id },
        data: {
          ...(changes.slug !== undefined && { slug: changes.slug ?? null }),
          ...(changes.title !== undefined && { title: changes.title }),
          ...(changes.description !== undefined && {
            description: changes.description ?? "",
          }),
          ...(changes.shortDescription !== undefined && {
            shortDescription: changes.shortDescription,
          }),
          ...(changes.html !== undefined && { html: changes.html }),
          ...(changes.css !== undefined && { css: changes.css }),
          ...(changes.js !== undefined && { js: changes.js }),
          ...(changes.tags !== undefined && { tags: changes.tags }),
          ...(changes.mainCategory !== undefined && {
            mainCategory: changes.mainCategory,
          }),
          ...(changes.secondaryCategory !== undefined && {
            secondaryCategory: changes.secondaryCategory,
          }),
          ...(changes.reviewed !== undefined && { reviewed: changes.reviewed }),
          ...(changes.deleted !== undefined && { deleted: changes.deleted }),
        },
      });
      return toElementDomain(row);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<Element | null> {
    const existing = await this.getById(id);
    if (!existing || existing.deleted) return existing;
    const row = await this.prisma.element.update({
      where: { id },
      data: { deleted: true },
    });
    return toElementDomain(row);
  }

  async restore(id: string): Promise<Element | null> {
    const existing = await this.getById(id);
    if (!existing || !existing.deleted) return existing;
    const row = await this.prisma.element.update({
      where: { id },
      data: { deleted: false },
    });
    return toElementDomain(row);
  }

  async bulkApprove(ids: readonly string[] | "pending"): Promise<number> {
    const where: Prisma.ElementWhereInput = {
      reviewed: false,
      deleted: false,
      ...(ids === "pending" ? {} : { id: { in: [...ids] } }),
    };
    const result = await this.prisma.element.updateMany({
      where,
      data: { reviewed: true },
    });
    return result.count;
  }

  async bulkSoftDelete(ids: readonly string[]): Promise<number> {
    const cleaned = ids.filter((id) => id.length > 0);
    if (cleaned.length === 0) return 0;
    const result = await this.prisma.element.updateMany({
      where: { deleted: false, id: { in: cleaned } },
      data: { deleted: true },
    });
    return result.count;
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const [
      total,
      published,
      pending,
      deleted,
      missingCategory,
      missingShortDescription,
      missingTags,
      recentRows,
    ] = await Promise.all([
      this.prisma.element.count(),
      this.prisma.element.count({ where: { reviewed: true, deleted: false } }),
      this.prisma.element.count({ where: { reviewed: false, deleted: false } }),
      this.prisma.element.count({ where: { deleted: true } }),
      this.prisma.element.count({
        where: { deleted: false, mainCategory: { isEmpty: true } },
      }),
      this.prisma.element.count({
        where: {
          deleted: false,
          OR: [{ shortDescription: null }, { shortDescription: "" }],
        },
      }),
      this.prisma.element.count({
        where: { deleted: false, tags: { isEmpty: true } },
      }),
      this.prisma.element.findMany({
        take: 6,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ]);

    return {
      total,
      published,
      pending,
      deleted,
      missingCategory,
      missingShortDescription,
      missingTags,
      recent: recentRows.map(toElementDomain),
    };
  }
}
