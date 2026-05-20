import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { assertAdminApi } from "@/lib/auth/guards";
import { makeElementWriteService } from "@/features/elements/di/adminWrite";
import { elementCreateSchema } from "@/features/elements/validation/elementWriteSchemas";
import { parseJsonBody } from "@/shared/http/validation";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

type PaginatedResponse = {
  items: ElementDTO[];
  total: number;
  page: number;
  pageSize: number;
};

function parsePositiveInt(value: string | null, fallback: number, max = 100) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

export async function GET(request: NextRequest) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 6);
  const searchQuery = (searchParams.get("search") || "").trim();

  const where = {
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" as const } },
            { description: { contains: searchQuery, mode: "insensitive" as const } },
            { shortDescription: { contains: searchQuery, mode: "insensitive" as const } },
            { tags: { hasSome: [searchQuery] } },
          ],
        }
      : {}),
  };

  try {
    const [total, elements] = await Promise.all([
      prisma.element.count({ where }),
      prisma.element.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const payload: PaginatedResponse = {
      items: elements.map(toElementDTO),
      total,
      page,
      pageSize,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching elements:", error);
    return NextResponse.json({ error: "Failed to fetch elements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const json = await request.json().catch(() => null);
  const parsed = parseJsonBody(elementCreateSchema, json);

  if (parsed.ok === false) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const created = await service.create(parsed.data);
    return NextResponse.json(toElementDTO(created), { status: 201 });
  } catch (error) {
    console.error("Error creating element:", error);
    return NextResponse.json({ error: "Failed to create element" }, { status: 500 });
  }
}
