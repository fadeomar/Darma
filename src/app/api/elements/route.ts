import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { makeElementWriteService } from "@/features/elements/di/adminWrite";
import { elementCreateSchema } from "@/features/elements/validation/elementWriteSchemas";
import { parseJsonBody } from "@/shared/http/validation";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import { getRepositories } from "@/server/repositories";
import { explorerContentWriteErrorResponse } from "@/server/http/explorerContentWriteError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaginatedResponse = {
  items: ElementDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export async function GET(request: NextRequest) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.max(1, Number(searchParams.get("pageSize") || "6"));
  const searchQuery = (searchParams.get("search") || "").trim();

  try {
    const result = await getRepositories().adminElement.list({
      query: searchQuery,
      status: "all",
      page,
      pageSize,
    });
    const payload: PaginatedResponse = {
      items: result.items.map(toElementDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
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
    const created = await makeElementWriteService().create(parsed.data);
    return NextResponse.json(toElementDTO(created), { status: 201 });
  } catch (error) {
    const response = explorerContentWriteErrorResponse(error);
    if (response) return response;
    console.error("Error creating element:", error);
    return NextResponse.json({ error: "Failed to create element" }, { status: 500 });
  }
}
