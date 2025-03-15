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

// Define the params type explicitly
interface Params {
  id: string;
}

export async function PUT(
  request: Request,
  context: { params: Params }
): Promise<NextResponse<CodeElement | { error: string }>> {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const updates: Partial<CodeElement> = await request.json();
  const data = readData();
  const elementIndex = data.elements.findIndex((el) => el.id === id);

  if (elementIndex === -1) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const existingElement = data.elements[elementIndex];

  if (!existingElement.createdAt) {
    existingElement.createdAt = now;
  }

  existingElement.updatedAt = now;
  const updatedElement = { ...existingElement, ...updates };
  data.elements[elementIndex] = updatedElement;
  writeData(data);
  return NextResponse.json(updatedElement);
}

export async function DELETE(
  request: Request,
  context: { params: Params }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const data = readData();
  const elementIndex = data.elements.findIndex((el) => el.id === id);

  if (elementIndex === -1) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }

  data.elements[elementIndex].deleted = true;
  writeData(data);
  return NextResponse.json({ message: "Element marked as deleted" });
}
