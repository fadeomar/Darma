// src/app/api/admin/review-queue/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { toElementDTO } from "@/features/projects/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/projects/dto/element.dto";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function GET(
  request: Request,
): Promise<NextResponse<Paginated<ElementDTO> | { error: string }>> {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const status = (searchParams.get("status") || "pending") as
    | "pending"
    | "deleted"
    | "all";

  // pending: reviewed=false AND deleted=false
  // deleted: deleted=true
  // all: (reviewed=false AND deleted=false) OR deleted=true
  const where =
    status === "pending"
      ? { reviewed: false, deleted: false }
      : status === "deleted"
        ? { deleted: true }
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
    return NextResponse.json(
      { error: "Failed to fetch review queue" },
      { status: 500 },
    );
  }
}
