import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";
import elementsJson from "@/data/elements.json";

type SortKey = "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

type SearchInput = {
  q?: string;
  mainCat?: string[];
  secCat?: string[];
  exactMatch?: boolean;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  order?: SortOrder;
};

function isDbDown(err: unknown) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P1001"
  );
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3) {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // retry only for DB connectivity issues
      if (!isDbDown(err)) throw err;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function searchElements({
  q,
  mainCat = [],
  secCat = [],
  exactMatch = false,
  page = 1,
  pageSize = 6,
  sort = "createdAt",
  order = "desc",
}: SearchInput) {
  const skip = (page - 1) * pageSize;

  const qClean = q?.trim();
  const textMode = exactMatch ? "equals" : "contains";

  // ✅ AND between blocks, OR inside text fields
  const where: Prisma.ElementWhereInput = {
    deleted: false,
    ...(qClean
      ? {
          OR: [
            { title: { [textMode]: qClean, mode: "insensitive" } },
            { description: { [textMode]: qClean, mode: "insensitive" } },
            { shortDescription: { [textMode]: qClean, mode: "insensitive" } },

            // tags: exact match only (reliable). If you want partial tag match later, we’ll add FTS.
            ...(exactMatch ? [{ tags: { has: qClean } }] : []),
          ],
        }
      : {}),
    ...(mainCat.length
      ? exactMatch
        ? { mainCategory: { hasEvery: mainCat } }
        : { mainCategory: { hasSome: mainCat } }
      : {}),
    ...(secCat.length
      ? exactMatch
        ? { secondaryCategory: { hasEvery: secCat } }
        : { secondaryCategory: { hasSome: secCat } }
      : {}),
  };

  try {
    const [total, elements] = await withRetry(async () => {
      const [t, els] = await Promise.all([
        prisma.element.count({ where }),
        prisma.element.findMany({
          where,
          orderBy: { [sort]: order },
          skip,
          take: pageSize,
        }),
      ]);
      return [t, els] as const;
    });

    return { success: true as const, total, elements, fallback: null as null };
  } catch (err) {
    // ✅ If DB is down, fall back to local JSON so search never “breaks the site”
    if (isDbDown(err)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = (elementsJson as any).elements ?? (elementsJson as any); // depends on your json shape
      const qLower = qClean?.toLowerCase();

      const filtered = (Array.isArray(all) ? all : [])
        .filter((e) => !e.deleted)
        .filter((e) => {
          // mainCats
          if (mainCat.length) {
            const arr = e.mainCategory ?? [];
            const ok = exactMatch
              ? mainCat.every((c) => arr.includes(c))
              : mainCat.some((c) => arr.includes(c));
            if (!ok) return false;
          }
          // secCats
          if (secCat.length) {
            const arr = e.secondaryCategory ?? [];
            const ok = exactMatch
              ? secCat.every((c) => arr.includes(c))
              : secCat.some((c) => arr.includes(c));
            if (!ok) return false;
          }
          // q
          if (qLower) {
            const hay = `${e.title ?? ""} ${e.description ?? ""} ${
              e.shortDescription ?? ""
            }`.toLowerCase();
            if (exactMatch) {
              // exact: compare equality against fields (simple fallback)
              const exact =
                (e.title ?? "").toLowerCase() === qLower ||
                (e.description ?? "").toLowerCase() === qLower ||
                (e.shortDescription ?? "").toLowerCase() === qLower ||
                (e.tags ?? []).some((t: string) => t.toLowerCase() === qLower);
              return exact;
            }
            return hay.includes(qLower);
          }
          return true;
        });

      const start = (page - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      return {
        success: true as const,
        total: filtered.length,
        elements: pageItems,
        fallback: "json" as const,
      };
    }

    throw err;
  }
}
