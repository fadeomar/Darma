import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { CodeElement } from "@/types";

export async function GET(request: Request): Promise<
  | NextResponse<{
      data: CodeElement[];
      page: number;
      pageSize: number;
      total: number;
    }>
  | NextResponse<{ error: string }>
> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10); // Default to page 1
  const pageSize = parseInt(searchParams.get("pageSize") || "6", 10); // Default to 6 items per page
  const searchQuery = searchParams.get("q") || ""; // Search query
  const mainCats = searchParams.getAll("mainCat"); // Selected main categories
  const secCats = searchParams.getAll("secCat"); // Selected secondary categories

  try {
    // Fetch elements based on search query and filters
    const elements = await prisma.element.findMany({
      where: {
        deleted: false,
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { tags: { hasSome: [searchQuery] } },
            ],
          },
          {
            OR: [
              mainCats.length === 0
                ? {}
                : { mainCategory: { hasSome: mainCats } },
              secCats.length === 0
                ? {}
                : { secondaryCategory: { hasSome: secCats } },
            ],
          },
        ],
      },
      skip: (page - 1) * pageSize, // Skip items from previous pages
      take: pageSize, // Limit the number of items per page
    });

    // Fetch the total number of matching elements
    const total = await prisma.element.count({
      where: {
        deleted: false,
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { tags: { hasSome: [searchQuery] } },
            ],
          },
          {
            OR: [
              mainCats.length === 0
                ? {}
                : { mainCategory: { hasSome: mainCats } },
              secCats.length === 0
                ? {}
                : { secondaryCategory: { hasSome: secCats } },
            ],
          },
        ],
      },
    });

    return NextResponse.json({
      data: elements,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error("Error fetching elements:", error);
    return NextResponse.json(
      { error: "Failed to fetch elements" },
      { status: 500 }
    );
  }
}
