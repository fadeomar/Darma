import type { ElementSearchSpec } from "../../domain/search/elementSearch.types";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  ElementRepository,
  ElementSearchResult,
} from "../../domain/element.repository";
import { toElementDomain } from "./elementPrisma.mapper";

// function normalizePage(n: number): number {
//   if (!Number.isFinite(n) || n < 1) return 1;
//   return Math.floor(n);
// }

// function normalizePageSize(n: number): number {
//   if (!Number.isFinite(n) || n < 1) return 12;
//   return Math.min(100, Math.floor(n));
// }

// function buildWhere(input: ElementSearchInput): Prisma.ElementWhereInput {
//   const { q, exactMatch, mainCategory = [], secondaryCategory = [] } = input;

//   const where: Prisma.ElementWhereInput = {};
//   where.deleted = false;
//   // Category filters (array columns w/ GIN)
//   if (mainCategory.length > 0) {
//     where.mainCategory = { hasSome: mainCategory };
//   }
//   if (secondaryCategory.length > 0) {
//     where.secondaryCategory = { hasSome: secondaryCategory };
//   }

//   // Query filter
//   if (q && q.trim().length > 0) {
//     const needle = q.trim();

//     // Without full-text indexing, keep it predictable and safe:
//     // - exactMatch => equals on title/slug
//     // - otherwise => contains (case-insensitive) on title/description/slug
//     where.OR = exactMatch
//       ? [{ title: { equals: needle, mode: "insensitive" } }]
//       : [
//           { title: { contains: needle, mode: "insensitive" } },
//           { description: { contains: needle, mode: "insensitive" } },
//           // Optional: treat query as a tag hit too (cheap with GIN)
//           { tags: { has: needle } },
//         ];
//   }

//   return where;
// }

// function buildOrderBy(
//   sort: ElementSearchInput["sort"],
// ): Prisma.ElementOrderByWithRelationInput {
//   switch (sort) {
//     case "oldest":
//       return { createdAt: "asc" };
//     case "titleAsc":
//       return { title: "asc" };
//     case "titleDesc":
//       return { title: "desc" };
//     case "newest":
//     default:
//       return { createdAt: "desc" };
//   }
// }

export class ElementPrismaRepository implements ElementRepository {
  async search(spec: ElementSearchSpec): Promise<ElementSearchResult> {
    const { filters, pagination, sort } = spec;

    const where: Prisma.ElementWhereInput = {};

    // ✅ Visibility policy (public vs admin)
    // Public safety default
    if (spec.publicOnly) {
      where.deleted = false;
    } else {
      // Admin: hide deleted unless explicitly included
      if (!spec.includeDeleted) {
        where.deleted = false;
      }

      // Admin: optional reviewed filter
      if (spec.reviewed !== undefined) {
        where.reviewed = spec.reviewed;
      }
    }

    // Category filters (GIN array)
    if (filters.mainCategory && filters.mainCategory.length > 0) {
      where.mainCategory = { hasSome: filters.mainCategory };
    }
    if (filters.secondaryCategory && filters.secondaryCategory.length > 0) {
      where.secondaryCategory = { hasSome: filters.secondaryCategory };
    }

    // Query filter
    if (filters.q && filters.q.length > 0) {
      const needle = filters.q;

      where.OR = filters.exactMatch
        ? [{ title: { equals: needle, mode: "insensitive" } }]
        : [
            { title: { contains: needle, mode: "insensitive" } },
            { description: { contains: needle, mode: "insensitive" } },
            { tags: { has: needle } },
          ];
    }

    const orderBy: Prisma.ElementOrderByWithRelationInput = (() => {
      switch (sort) {
        case "oldest":
          return { createdAt: "asc" };
        case "titleAsc":
          return { title: "asc" };
        case "titleDesc":
          return { title: "desc" };
        case "newest":
        default:
          return { createdAt: "desc" };
      }
    })();

    const page = pagination.page;
    const pageSize = pagination.pageSize;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Projection: preview includes html/css/js (your homepage needs it)
    const select: Prisma.ElementSelect = {
      id: true,
      title: true,
      description: true,
      shortDescription: true,

      html: true,
      css: true,
      js: true,

      tags: true,
      mainCategory: true,
      secondaryCategory: true,

      deleted: true,
      reviewed: true,

      createdAt: true,
      updatedAt: true,
    };

    const [total, rows] = await prisma.$transaction([
      prisma.element.count({ where }),
      prisma.element.findMany({ where, orderBy, skip, take, select }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: rows.map(toElementDomain),
    };
  }

  async getById(id: string) {
    const row = await prisma.element.findFirst({
      where: {
        id,
        deleted: false, // public safety
        // IMPORTANT: do NOT require reviewed:true unless you intentionally want that behavior
      },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        html: true,
        css: true,
        js: true,
        tags: true,
        mainCategory: true,
        secondaryCategory: true,
        deleted: true,
        reviewed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return row ? toElementDomain(row) : null;
  }
}

// function buildSelect(projection: "preview" | "summary"): Prisma.ElementSelect {
//   const base: Prisma.ElementSelect = {
//     id: true,
//     title: true,
//     description: true,
//     shortDescription: true,
//     tags: true,
//     mainCategory: true,
//     secondaryCategory: true,
//     deleted: true,
//     reviewed: true,
//     createdAt: true,
//     updatedAt: true,
//   };

//   if (projection === "summary") return base;

//   return {
//     ...base,
//     html: true,
//     css: true,
//     js: true,
//   };
// }
