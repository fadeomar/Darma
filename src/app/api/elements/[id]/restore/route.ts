/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/elements/[id]/restore/route.ts
import { NextResponse } from "next/server";
import { makeElementWriteService } from "@/features/projects/di/adminWrite";
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";
import { ElementNotFoundError } from "@/features/projects/application/elementWriteService";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const restored = await service.restore(id);
    return NextResponse.json(toElementDTO(restored), { status: 200 });
  } catch (error: any) {
    if (
      error?.name === "ElementNotFoundError" ||
      error instanceof ElementNotFoundError
    ) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    console.error("Error restoring element:", error);
    return NextResponse.json(
      { error: "Failed to restore element" },
      { status: 500 },
    );
  }
}
