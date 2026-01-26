/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { makeElementWriteService } from "@/features/projects/di/adminWrite";

import { elementUpdateSchema } from "@/features/projects/validation/elementWriteSchemas";
import { parseJsonBody } from "@/shared/http/validation";
import { ElementNotFoundError } from "@/features/projects/application/elementWriteService";

// ✅ Use YOUR existing DTO mapper file (adjust exported function name!)
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";
import { getPublicElementByIdDTO } from "@/server/services/element.service";

/**
 * NOTE:
 * - This route is now: GET (read), PUT (admin update), DELETE (admin soft delete).
 * - POST should live in /api/elements/route.ts (collection route), not here.
 * - Add admin auth/guard where marked.
 */

type RouteContext = { params: Promise<{ id: string }> };

// GET: Fetch a single element by ID (kept, but return DTO)
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const dto = await getPublicElementByIdDTO(id); // ✅ enforces reviewed=true && deleted=false
    if (!dto) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    console.error("Error fetching element:", error);
    return NextResponse.json(
      { error: "Failed to fetch element" },
      { status: 500 },
    );
  }
}

// PUT: Update an existing element (admin write service + validation)
export async function PUT(request: Request, context: RouteContext) {
  // TODO: enforce admin auth/guard (middleware or here)

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);

  // Defensive: never accept id/deleted from body (overposting protection)
  const sanitized =
    json && typeof json === "object"
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, deleted: _deleted, ...rest } = json as any;
          return rest;
        })()
      : json;

  const parsed = parseJsonBody(elementUpdateSchema, sanitized);

  if (!parsed.ok) {
    console.error("PUT /api/elements/[id] validation failed:", parsed.error);
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const updated = await service.update(id, parsed.data);

    return NextResponse.json(toElementDTO(updated), { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }
    if (
      error?.name === "ElementNotFoundError" ||
      error instanceof ElementNotFoundError
    ) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    console.error("Error updating element:", error);
    return NextResponse.json(
      { error: "Failed to update element" },
      { status: 500 },
    );
  }
}

// DELETE: Soft delete (admin write service; repository decides "soft delete")
export async function DELETE(_request: Request, context: RouteContext) {
  // TODO: enforce admin auth/guard (middleware or here)

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const deleted = await service.softDelete(id);

    // Returning the deleted resource is usually nicer for admin UI than a message
    return NextResponse.json(toElementDTO(deleted), { status: 200 });
  } catch (error: any) {
    if (
      error?.name === "ElementNotFoundError" ||
      error instanceof ElementNotFoundError
    ) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    console.error("Error soft deleting element:", error);
    return NextResponse.json(
      { error: "Failed to soft delete element" },
      { status: 500 },
    );
  }
}
