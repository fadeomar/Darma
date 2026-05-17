import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { makeElementWriteService } from "@/features/elements/di/adminWrite";
import { elementUpdateSchema } from "@/features/elements/validation/elementWriteSchemas";
import { parseJsonBody } from "@/shared/http/validation";
import { ElementNotFoundError } from "@/features/elements/application/elementWriteService";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import { getPublicElementByIdDTO } from "@/server/services/element.service";

type RouteContext = { params: Promise<{ id: string }> };

type JsonObject = Record<string, unknown>;

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const dto = await getPublicElementByIdDTO(id);
    if (!dto) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    console.error("Error fetching element:", error);
    return NextResponse.json({ error: "Failed to fetch element" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const json = await request.json().catch(() => null);
  const sanitized =
    json && typeof json === "object" && !Array.isArray(json)
      ? sanitizeElementUpdatePayload(json as JsonObject)
      : json;

  const parsed = parseJsonBody(elementUpdateSchema, sanitized);
  if (parsed.ok === false) {
    console.error("PUT /api/elements/[id] validation failed:", parsed.error);
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const updated = await service.update(id, parsed.data);
    return NextResponse.json(toElementDTO(updated), { status: 200 });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if (error instanceof ElementNotFoundError) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    console.error("Error updating element:", error);
    return NextResponse.json({ error: "Failed to update element" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const deleted = await service.softDelete(id);
    return NextResponse.json(toElementDTO(deleted), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ElementNotFoundError) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    console.error("Error soft deleting element:", error);
    return NextResponse.json({ error: "Failed to soft delete element" }, { status: 500 });
  }
}

function sanitizeElementUpdatePayload(payload: JsonObject): JsonObject {
  const { id: _id, deleted: _deleted, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = payload;
  return rest;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
