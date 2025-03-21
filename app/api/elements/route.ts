import { NextResponse } from "next/server";
import { CodeElement } from "@/types";

import prisma from "../../../lib/prisma";

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
  const searchQuery = searchParams.get("search") || ""; // Get search query

  try {
    // Fetch the total number of active elements (for pagination)
    const total = await prisma.element.count({
      where: {
        deleted: false,
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { tags: { hasSome: [searchQuery] } },
        ],
      },
    });

    // Fetch paginated elements (with search filter)
    const elements = await prisma.element.findMany({
      where: {
        deleted: false,
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { tags: { hasSome: [searchQuery] } },
        ],
      },
      skip: (page - 1) * pageSize, // Skip items from previous pages
      take: pageSize, // Limit the number of items per page
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: Request): Promise<NextResponse<any>> {
  const elementData: Partial<CodeElement> = await request.json();

  // Validate required fields
  if (!elementData.title || !elementData.html) {
    return NextResponse.json(
      { error: "Title and HTML are required" },
      { status: 400 }
    );
  }

  try {
    // Create a new element in the database
    const newElement = await prisma.element.create({
      data: {
        title: elementData.title,
        description: elementData.description || "",
        shortDescription: elementData?.shortDescription || "",
        html: elementData.html,
        css: elementData.css || "",
        js: elementData.js || "",
        tags: elementData.tags || [],
        mainCategory: elementData.mainCategory || [],
        secondaryCategory: elementData.secondaryCategory || [],
        deleted: false, // Default value
      },
    });

    // Return the newly created element
    return NextResponse.json(newElement, { status: 201 });
  } catch (error) {
    console.error("Error creating element:", error);
    return NextResponse.json(
      { error: "Failed to create element" },
      { status: 500 }
    );
  }
}
