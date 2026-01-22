import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { CodeElement } from "@/types";

// GET: Fetch a single element by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // Fixed to use Promise
): Promise<NextResponse<CodeElement | { error: string }>> {
  const params = await context.params; // Await the params
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const element = await prisma.element.findUnique({
      where: { id },
    });

    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    return NextResponse.json(element);
  } catch (error) {
    console.error("Error fetching element:", error);
    return NextResponse.json(
      { error: "Failed to fetch element" },
      { status: 500 }
    );
  }
}

// POST: Create a new element
export async function POST(
  request: Request
): Promise<NextResponse<CodeElement | { error: string }>> {
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
        shortDescription: elementData.shortDescription ?? null, // Using nullish coalescing
        html: elementData.html,
        css: elementData.css ?? "", // Changed to empty string instead of null
        js: elementData.js ?? "", // Changed to empty string instead of null
        tags: elementData.tags || [],
        mainCategory: elementData.mainCategory || [],
        secondaryCategory: elementData.secondaryCategory || [],
        deleted: false,
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
// PUT: Update an existing element
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<CodeElement | { error: string }>> {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const updates: Partial<CodeElement> = await request.json();

  try {
    const existingElement = await prisma.element.findUnique({
      where: { id },
    });

    if (!existingElement) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }
    const updatedElement = await prisma.element.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        shortDescription: updates.shortDescription ?? undefined,
        html: updates.html,
        css: updates.css ?? "",
        js: updates.js,
        tags: updates.tags,
        mainCategory: updates.mainCategory,
        secondaryCategory: updates.secondaryCategory,
        deleted: updates.deleted,
        reviewed: updates.reviewed, // New field
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedElement);
  } catch (error) {
    console.error("Error updating element:", error);
    return NextResponse.json(
      { error: "Failed to update element" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const existingElement = await prisma.element.findUnique({
      where: { id },
    });

    if (!existingElement) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    await prisma.element.update({
      where: { id },
      data: {
        deleted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Element soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting element:", error);
    return NextResponse.json(
      { error: "Failed to soft delete element" },
      { status: 500 }
    );
  }
}
