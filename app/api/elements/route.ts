import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CodeElement } from "@/types";

const filePath = path.join(process.cwd(), "data", "elements.json");

interface Data {
  elements: CodeElement[];
}

function readData(): Data {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.log({ error });
    return { elements: [] };
  }
}

function writeData(data: Data): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET(): Promise<NextResponse<CodeElement[]>> {
  const data = readData();
  // Filter out deleted elements
  const activeElements = data.elements.filter((el) => !el.deleted);
  return NextResponse.json(activeElements);
}

export async function POST(
  request: Request
): Promise<NextResponse<CodeElement>> {
  const elementData: Partial<CodeElement> = await request.json();

  if (!elementData.title || !elementData.html) {
    return NextResponse.json(
      { error: "Title and HTML are required" },
      { status: 400 }
    );
  }

  const data = readData();
  const now = new Date().toISOString(); // Current timestamp

  const newElement: CodeElement = {
    ...elementData,
    id: Date.now().toString(),
    tags: elementData.tags || [],
    deleted: false,
    createdAt: now, // Set createdAt
    updatedAt: now, // Set updatedAt
  } as CodeElement;

  data.elements.push(newElement);
  writeData(data);
  return NextResponse.json(newElement, { status: 201 });
}
