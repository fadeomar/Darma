/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/guards";
import { makeElementWriteService } from "@/features/elements/di/adminWrite";
import { toElementDTO } from "@/features/elements/dto/element.dto.mapper";
import { explorerContentWriteErrorResponse } from "@/server/http/explorerContentWriteError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await assertAdminApi(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const service = makeElementWriteService();
    const restored = await service.restore(id);
    return NextResponse.json(toElementDTO(restored), { status: 200 });
  } catch (error: unknown) {
    const response = explorerContentWriteErrorResponse(error);
    if (response) return response;
    console.error("Error restoring element:", error);
    return NextResponse.json({ error: "Failed to restore element" }, { status: 500 });
  }
}
