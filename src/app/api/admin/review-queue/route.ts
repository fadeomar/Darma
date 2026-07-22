import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import type { AdminElementStatus } from "@/features/elements/domain/admin/elementAdmin.repository";
import { getRepositories } from "@/server/repositories";
import { explorerContentWriteErrorResponse } from "@/server/http/explorerContentWriteError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));
  const requested = searchParams.get("status") || "pending";
  const status: AdminElementStatus =
    requested === "deleted" ||
    requested === "approved" ||
    requested === "needSlug" ||
    requested === "pending"
      ? requested
      : "reviewQueue";

  try {
    const result = await getRepositories().adminElement.list({
      status,
      page,
      pageSize,
    });
    return NextResponse.json({
      items: result.items.map(toElementDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json({ error: "Failed to fetch review queue" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ approved: number } | { error: string }>> {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => null)) as
    | { action?: string; ids?: unknown; scope?: unknown }
    | null;
  if (!body || body.action !== "approve") {
    return NextResponse.json(
      { error: 'Unsupported action. Expected { action: "approve" }.' },
      { status: 400 },
    );
  }

  let selection: readonly string[] | "pending";
  if (body.scope === "pending") {
    selection = "pending";
  } else if (Array.isArray(body.ids)) {
    const ids = body.ids.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid ids provided." }, { status: 400 });
    }
    selection = ids;
  } else {
    return NextResponse.json(
      { error: 'Provide either { ids: string[] } or { scope: "pending" }.' },
      { status: 400 },
    );
  }

  try {
    const approved = await getRepositories().adminElement.bulkApprove(selection);
    return NextResponse.json({ approved });
  } catch (error) {
    const response = explorerContentWriteErrorResponse(error);
    if (response) return response;
    console.error("Error bulk-approving review queue:", error);
    return NextResponse.json({ error: "Failed to bulk-approve elements" }, { status: 500 });
  }
}
