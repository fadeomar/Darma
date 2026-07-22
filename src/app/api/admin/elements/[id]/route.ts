import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import { getRepositories } from "@/server/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const row = await getRepositories().adminElement.getById(id);
    if (!row) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }
    return NextResponse.json(toElementDTO(row));
  } catch (error) {
    console.error("Error fetching element for admin edit:", error);
    return NextResponse.json({ error: "Failed to fetch element" }, { status: 500 });
  }
}
