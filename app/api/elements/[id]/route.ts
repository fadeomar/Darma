import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CodeElement } from "@/types";

const filePath = path.join(process.cwd(), "data", "elements.json");

function readData(): CodeElement {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

function writeData(data: CodeElement): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// app/api/elements/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<CodeElement | { error: string }>> {
  const { id } = params;
  const updates: Partial<CodeElement> = await request.json();

  const data = readData();
  const elementIndex = data.elements.findIndex(
    (el: { id: string }) => el.id === id
  );

  if (elementIndex === -1) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }

  const now = new Date().toISOString(); // Current timestamp
  const existingElement = data.elements[elementIndex];

  // If createdAt doesn't exist, set it to the current timestamp
  if (!existingElement.createdAt) {
    existingElement.createdAt = now;
  }

  // Always update updatedAt
  existingElement.updatedAt = now;

  // Merge updates into the existing element
  const updatedElement = { ...existingElement, ...updates };
  data.elements[elementIndex] = updatedElement;
  writeData(data);
  return NextResponse.json(updatedElement);
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  const { id } = params;

  const data = readData();
  const elementIndex = data.elements.findIndex(
    (el: { id: string }) => el.id === id
  );

  if (elementIndex === -1) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }

  // Soft delete by setting deleted flag
  data.elements[elementIndex].deleted = true;
  writeData(data);
  return NextResponse.json({ message: "Element marked as deleted" });
}
