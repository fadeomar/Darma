import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "6");
  const searchQuery = searchParams.get("q") || "";
  const mainCats = searchParams.getAll("mainCat").filter(Boolean); // Use getAll for arrays
  const secCats = searchParams.getAll("secCat").filter(Boolean); // Use getAll for arrays

  // Build the andConditions array
  const andConditions: Prisma.ElementWhereInput[] = [];

  if (searchQuery) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: searchQuery,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          description: {
            contains: searchQuery,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        { tags: { hasSome: [searchQuery] } },
      ],
    });
  }

  // Handle mainCats as an array
  if (mainCats.length > 0) {
    andConditions.push({ mainCategory: { hasSome: mainCats } });
  }

  // Handle secCats as an array
  if (secCats.length > 0) {
    andConditions.push({ secondaryCategory: { hasSome: secCats } });
  }

  // Define the where clause
  const where: Prisma.ElementWhereInput = {
    deleted: false,
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  // Execute the Prisma query
  const elements = await prisma.element.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await prisma.element.count({ where });

  return NextResponse.json({ elements, total });
}
