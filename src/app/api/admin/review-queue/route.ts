import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { assertAdminApi } from "@/lib/auth/guards";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function GET(
  request: NextRequest,
): Promise<NextResponse<Paginated<ElementDTO> | { error: string }>> {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const status = (searchParams.get("status") || "pending") as
    | "pending"
    | "deleted"
    | "approved"
    | "needSlug"
    | "all";

  const where =
    status === "pending"
      ? { reviewed: false, deleted: false }
      : status === "deleted"
        ? { deleted: true }
        : status === "approved"
          ? { reviewed: true, deleted: false }
          : status === "needSlug"
            ? { deleted: false, OR: [{ slug: null }, { slug: "" }] }
            : { OR: [{ reviewed: false, deleted: false }, { deleted: true }] };

  try {
    const total = await prisma.element.count({ where });
    const rows = await prisma.element.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items: rows.map(toElementDTO),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json({ error: "Failed to fetch review queue" }, { status: 500 });
  }
}

/**
 * Bulk-approve pending elements (sets reviewed = true so they appear on Explore).
 * Body:
 *   { action: "approve", ids: string[] }   → approve the given (non-deleted) ids
 *   { action: "approve", scope: "pending" } → approve the entire pending backlog
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ approved: number } | { error: string }>> {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => null)) as
    | { action?: string; ids?: unknown; scope?: unknown }
    | null;

  if (!body || body.action !== "approve") {
    return NextResponse.json({ error: 'Unsupported action. Expected { action: "approve" }.' }, { status: 400 });
  }

  let where: { reviewed: boolean; deleted: boolean; id?: { in: string[] } };

  if (body.scope === "pending") {
    where = { reviewed: false, deleted: false };
  } else if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((id): id is string => typeof id === "string" && id.length > 0);
    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid ids provided." }, { status: 400 });
    }
    // Only approve items that are actually pending (never resurrect deleted ones).
    where = { reviewed: false, deleted: false, id: { in: ids } };
  } else {
    return NextResponse.json(
      { error: 'Provide either { ids: string[] } or { scope: "pending" }.' },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.element.updateMany({ where, data: { reviewed: true } });
    return NextResponse.json({ approved: result.count });
  } catch (error) {
    console.error("Error bulk-approving review queue:", error);
    return NextResponse.json({ error: "Failed to bulk-approve elements" }, { status: 500 });
  }
}
