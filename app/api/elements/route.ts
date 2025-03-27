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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);
  const searchQuery = searchParams.get("search") || "";

  try {
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

    const elements = await prisma.element.findMany({
      where: {
        deleted: false,
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { tags: { hasSome: [searchQuery] } },
        ],
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: elements,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error("Error fetching elements:", error);
    // Ensure the error response is always an object with an 'error' property
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch elements";
    const errorResponse = { error: errorMessage };
    console.log("API Error Response:", errorResponse);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: Request): Promise<NextResponse<any>> {
  const elementData: Partial<CodeElement> = await request.json();

  if (!elementData.title || !elementData.html) {
    return NextResponse.json(
      { error: "Title and HTML are required" },
      { status: 400 }
    );
  }

  try {
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
        deleted: false,
        reviewed: elementData.reviewed || false, // New field
      },
    });

    return NextResponse.json(newElement, { status: 201 });
  } catch (error) {
    console.error("Error creating element:", error);
    return NextResponse.json(
      { error: "Failed to create element" },
      { status: 500 }
    );
  }
}
