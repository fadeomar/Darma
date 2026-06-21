import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { assertAdminApi } from "@/lib/auth/guards";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Admin-only single-element fetch.
 *
 * Unlike the public GET /api/elements/[id] (which only returns reviewed,
 * non-deleted items), this returns ANY element by id — including pending and
 * soft-deleted ones — so the admin edit form can be opened directly for
 * items shown in the Review Queue.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const row = await prisma.element.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }
    return NextResponse.json(toElementDTO(row));
  } catch (error) {
    console.error("Error fetching element for admin edit:", error);
    return NextResponse.json({ error: "Failed to fetch element" }, { status: 500 });
  }
}
