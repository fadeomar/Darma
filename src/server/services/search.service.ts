import { prisma } from "@/server/db/prisma";

type SearchInput = {
  q?: string;
  mainCat?: string[];
  exactMatch?: boolean;
  sort?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function searchElements({
  q,
  mainCat = [],
  exactMatch = false,
  sort = "createdAt",
  order = "desc",
  page = 1,
  pageSize = 6,
}: SearchInput) {
  const skip = (page - 1) * pageSize;
  const qClean = q?.trim();

  const textMode = exactMatch ? "equals" : "contains";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deleted: false,
    ...(mainCat.length
      ? {
          mainCategory: {
            hasSome: mainCat,
          },
        }
      : {}),
    ...(qClean
      ? {
          OR: [
            { title: { [textMode]: qClean, mode: "insensitive" } },
            { description: { [textMode]: qClean, mode: "insensitive" } },
            { shortDescription: { [textMode]: qClean, mode: "insensitive" } },
            { tags: { has: qClean } },
          ],
        }
      : {}),
  };

  const [total, elements] = await Promise.all([
    prisma.element.count({ where }),
    prisma.element.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take: pageSize,
    }),
  ]);

  return { total, elements };
}
