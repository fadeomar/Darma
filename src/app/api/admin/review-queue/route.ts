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

function parsePositiveInt(value: string | null, fallback: number, max = 100) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<Paginated<ElementDTO> | { error: string }>> {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 10);
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
